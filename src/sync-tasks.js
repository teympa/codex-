const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const STATUS_SOURCES_PATH = path.resolve(__dirname, "..", "config", "status-sources.json");
const NOTION_API_VERSION = "2022-06-28";
const DRY_RUN = process.argv.includes("--dry-run");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function extractIdFromNotionUrl(url) {
  const match = url.match(/([a-f0-9]{32})/i);
  if (!match) {
    throw new Error(`Could not extract Notion id from url: ${url}`);
  }

  return match[1];
}

function notionHeaders() {
  if (!process.env.NOTION_API_TOKEN) {
    throw new Error("NOTION_API_TOKEN is required to sync tasks.");
  }

  return {
    Authorization: `Bearer ${process.env.NOTION_API_TOKEN}`,
    "Notion-Version": NOTION_API_VERSION,
    "Content-Type": "application/json",
  };
}

async function notionRequest(url, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...notionHeaders(),
      ...(init.headers || {}),
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Notion request failed: ${response.status} ${JSON.stringify(data)}`);
  }

  return data;
}

async function githubRequest(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "codex-github-notion-sync",
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`GitHub request failed: ${response.status} ${JSON.stringify(data)}`);
  }

  return data;
}

async function fetchRepositoryIssues(repository) {
  const issues = await githubRequest(
    `https://api.github.com/repos/${repository}/issues?state=all&per_page=100`
  );

  return issues.filter((issue) => !issue.pull_request);
}

async function queryAllTaskPages(databaseId) {
  const results = [];
  let hasMore = true;
  let nextCursor = undefined;

  while (hasMore) {
    const data = await notionRequest(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      {
        method: "POST",
        body: JSON.stringify({
          page_size: 100,
          start_cursor: nextCursor,
        }),
      }
    );

    results.push(...data.results);
    hasMore = data.has_more;
    nextCursor = data.next_cursor;
  }

  return results;
}

function getTaskTitle(properties) {
  const titleProp = properties.Task;
  if (!titleProp || titleProp.type !== "title") {
    return "(untitled)";
  }

  return titleProp.title.map((part) => part.plain_text).join("") || "(untitled)";
}

function extractLabelNames(issue) {
  return issue.labels.map((label) => (typeof label === "string" ? label : label.name));
}

function mapStatus(issue, labels) {
  if (issue.state === "closed") {
    return "Done";
  }

  if (labels.some((label) => /^status:(review|pr-open|review-pending)$/i.test(label))) {
    return "Review";
  }

  if (labels.some((label) => /^status:(blocked|on-hold)$/i.test(label))) {
    return "Blocked";
  }

  if (labels.some((label) => /^status:(in-progress|doing|active)$/i.test(label))) {
    return "In Progress";
  }

  return "Planned";
}

function mapPriority(labels) {
  if (labels.some((label) => /^priority:high$/i.test(label))) {
    return "High";
  }

  if (labels.some((label) => /^priority:low$/i.test(label))) {
    return "Low";
  }

  if (labels.some((label) => /^priority:medium$/i.test(label))) {
    return "Medium";
  }

  return null;
}

function mapCategory(labels) {
  const rules = [
    { pattern: /^(ops|automation)$/i, value: "Ops" },
    { pattern: /^(research)$/i, value: "Research" },
    { pattern: /^(docs|documentation)$/i, value: "Docs" },
    { pattern: /^(design|planning|spec)$/i, value: "Planning" },
    { pattern: /^(implementation|feature|bug|fix|frontend|backend)$/i, value: "Implementation" },
  ];

  for (const rule of rules) {
    if (labels.some((label) => rule.pattern.test(label))) {
      return rule.value;
    }
  }

  return null;
}

function buildAssigneeText(issue) {
  const assignees = Array.isArray(issue.assignees) ? issue.assignees : [];
  if (assignees.length === 0) {
    return [];
  }

  return [
    {
      type: "text",
      text: {
        content: assignees.map((assignee) => assignee.login).join(", "),
      },
    },
  ];
}

function buildTaskProperties(issue) {
  const labels = extractLabelNames(issue);

  return {
    Task: {
      title: [
        {
          type: "text",
          text: {
            content: issue.title,
          },
        },
      ],
    },
    "GitHub Issue Number": {
      number: issue.number,
    },
    "GitHub Issue URL": {
      url: issue.html_url,
    },
    Status: {
      select: {
        name: mapStatus(issue, labels),
      },
    },
    Priority: mapPriority(labels)
      ? {
          select: {
            name: mapPriority(labels),
          },
        }
      : {
          select: null,
        },
    Category: mapCategory(labels)
      ? {
          select: {
            name: mapCategory(labels),
          },
        }
      : {
          select: null,
        },
    Source: {
      select: {
        name: "GitHub",
      },
    },
    Assignee: {
      rich_text: buildAssigneeText(issue),
    },
  };
}

function readSelectName(prop) {
  return prop?.select?.name || null;
}

function readRichText(prop) {
  return (prop?.rich_text || []).map((part) => part.plain_text).join("");
}

function propertiesDiffer(existingPage, desiredProperties) {
  const existing = existingPage.properties;
  const currentTitle = getTaskTitle(existing);
  const desiredTitle = desiredProperties.Task.title[0]?.text?.content || "";

  if (currentTitle !== desiredTitle) {
    return true;
  }

  if ((existing["GitHub Issue Number"]?.number || null) !== desiredProperties["GitHub Issue Number"].number) {
    return true;
  }

  if ((existing["GitHub Issue URL"]?.url || null) !== desiredProperties["GitHub Issue URL"].url) {
    return true;
  }

  if (readSelectName(existing.Status) !== desiredProperties.Status.select.name) {
    return true;
  }

  if (readSelectName(existing.Priority) !== (desiredProperties.Priority.select?.name || null)) {
    return true;
  }

  if (readSelectName(existing.Category) !== (desiredProperties.Category.select?.name || null)) {
    return true;
  }

  if (readSelectName(existing.Source) !== desiredProperties.Source.select.name) {
    return true;
  }

  if (readRichText(existing.Assignee) !== (desiredProperties.Assignee.rich_text[0]?.text?.content || "")) {
    return true;
  }

  return false;
}

async function createTask(databaseId, issue) {
  const properties = buildTaskProperties(issue);

  if (DRY_RUN) {
    console.log(`[dry-run] create Notion task for issue #${issue.number} ${issue.title}`);
    return;
  }

  await notionRequest("https://api.notion.com/v1/pages", {
    method: "POST",
    body: JSON.stringify({
      parent: {
        database_id: databaseId,
      },
      properties,
    }),
  });

  console.log(`created Notion task for issue #${issue.number} ${issue.title}`);
}

async function updateTask(pageId, issue, existingPage) {
  const properties = buildTaskProperties(issue);
  if (!propertiesDiffer(existingPage, properties)) {
    console.log(`no change for issue #${issue.number} ${issue.title}`);
    return;
  }

  if (DRY_RUN) {
    console.log(`[dry-run] update Notion task for issue #${issue.number} ${issue.title}`);
    return;
  }

  await notionRequest(`https://api.notion.com/v1/pages/${pageId}`, {
    method: "PATCH",
    body: JSON.stringify({ properties }),
  });

  console.log(`updated Notion task for issue #${issue.number} ${issue.title}`);
}

async function main() {
  const sources = readJson(STATUS_SOURCES_PATH);
  const databaseId = extractIdFromNotionUrl(sources.notion.tasksDatabaseUrl);
  const [issues, notionPages] = await Promise.all([
    fetchRepositoryIssues(sources.github.repository),
    queryAllTaskPages(databaseId),
  ]);

  const pagesByIssueNumber = new Map();
  for (const page of notionPages) {
    const issueNumber = page.properties["GitHub Issue Number"]?.number;
    if (issueNumber) {
      pagesByIssueNumber.set(issueNumber, page);
    }
  }

  console.log(
    `${DRY_RUN ? "[dry-run] " : ""}syncing ${issues.length} GitHub issues into Notion Tasks`
  );

  for (const issue of issues) {
    const existingPage = pagesByIssueNumber.get(issue.number);
    if (existingPage) {
      await updateTask(existingPage.id, issue, existingPage);
    } else {
      await createTask(databaseId, issue);
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
