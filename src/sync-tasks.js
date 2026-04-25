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

async function queryAllProjectPages(databaseId) {
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

function getProjectTitle(properties) {
  const titleProp = properties.Name;
  if (!titleProp || titleProp.type !== "title") {
    return "(untitled)";
  }

  return titleProp.title.map((part) => part.plain_text).join("") || "(untitled)";
}

function buildProjectsByName(projectPages) {
  const projectsByName = new Map();
  for (const page of projectPages) {
    projectsByName.set(getProjectTitle(page.properties).toLowerCase(), page);
  }
  return projectsByName;
}

function findProjectMapping(sources) {
  const mappings = Array.isArray(sources.notion?.projectMappings)
    ? sources.notion.projectMappings
    : [];

  return mappings.find(
    (mapping) =>
      String(mapping.repository || "").toLowerCase() ===
      String(sources.github.repository || "").toLowerCase()
  );
}

function resolveDefaultProject(sources, projectsByName) {
  const mapping = findProjectMapping(sources);
  if (!mapping?.projectName) {
    return null;
  }

  return projectsByName.get(mapping.projectName.toLowerCase()) || null;
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

function hasProjectRelation(page) {
  return (page.properties.Project?.relation || []).length > 0;
}

function addProjectRelation(properties, projectPage) {
  if (!projectPage) {
    return properties;
  }

  return {
    ...properties,
    Project: {
      relation: [
        {
          id: projectPage.id,
        },
      ],
    },
  };
}

function preserveUnmappedSelectsForUpdate(properties) {
  const nextProperties = { ...properties };

  if (!nextProperties.Priority.select) {
    delete nextProperties.Priority;
  }

  if (!nextProperties.Category.select) {
    delete nextProperties.Category;
  }

  return nextProperties;
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

  if (
    desiredProperties.Priority &&
    readSelectName(existing.Priority) !== (desiredProperties.Priority.select?.name || null)
  ) {
    return true;
  }

  if (
    desiredProperties.Category &&
    readSelectName(existing.Category) !== (desiredProperties.Category.select?.name || null)
  ) {
    return true;
  }

  if (readSelectName(existing.Source) !== desiredProperties.Source.select.name) {
    return true;
  }

  if (readRichText(existing.Assignee) !== (desiredProperties.Assignee.rich_text[0]?.text?.content || "")) {
    return true;
  }

  if (
    desiredProperties.Project &&
    (existing.Project?.relation?.[0]?.id || null) !==
      desiredProperties.Project.relation[0]?.id
  ) {
    return true;
  }

  return false;
}

async function createTask(databaseId, issue, defaultProject) {
  const properties = addProjectRelation(buildTaskProperties(issue), defaultProject);

  if (DRY_RUN) {
    const projectNote = defaultProject
      ? ` with Project ${getProjectTitle(defaultProject.properties)}`
      : "";
    console.log(`[dry-run] create Notion task for issue #${issue.number} ${issue.title}${projectNote}`);
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

  const projectNote = defaultProject
    ? ` with Project ${getProjectTitle(defaultProject.properties)}`
    : "";
  console.log(`created Notion task for issue #${issue.number} ${issue.title}${projectNote}`);
}

async function updateTask(pageId, issue, existingPage, defaultProject) {
  const shouldSetProject = defaultProject && !hasProjectRelation(existingPage);
  const baseProperties = preserveUnmappedSelectsForUpdate(buildTaskProperties(issue));
  const properties = shouldSetProject
    ? addProjectRelation(baseProperties, defaultProject)
    : baseProperties;

  if (!propertiesDiffer(existingPage, properties)) {
    console.log(`no change for issue #${issue.number} ${issue.title}`);
    return;
  }

  if (DRY_RUN) {
    const projectNote = shouldSetProject
      ? ` and set Project ${getProjectTitle(defaultProject.properties)}`
      : "";
    console.log(`[dry-run] update Notion task for issue #${issue.number} ${issue.title}${projectNote}`);
    return;
  }

  await notionRequest(`https://api.notion.com/v1/pages/${pageId}`, {
    method: "PATCH",
    body: JSON.stringify({ properties }),
  });

  const projectNote = shouldSetProject
    ? ` and set Project ${getProjectTitle(defaultProject.properties)}`
    : "";
  console.log(`updated Notion task for issue #${issue.number} ${issue.title}${projectNote}`);
}

async function main() {
  const sources = readJson(STATUS_SOURCES_PATH);
  const tasksDatabaseId = extractIdFromNotionUrl(sources.notion.tasksDatabaseUrl);
  const projectsDatabaseId = extractIdFromNotionUrl(sources.notion.projectsDatabaseUrl);
  const [issues, notionPages, projectPages] = await Promise.all([
    fetchRepositoryIssues(sources.github.repository),
    queryAllTaskPages(tasksDatabaseId),
    queryAllProjectPages(projectsDatabaseId),
  ]);
  const projectsByName = buildProjectsByName(projectPages);
  const defaultProject = resolveDefaultProject(sources, projectsByName);
  const mapping = findProjectMapping(sources);

  if (mapping?.projectName && !defaultProject) {
    console.log(
      `Project mapping not found: ${mapping.projectName}. Project relation will not be auto-filled.`
    );
  }

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
      await updateTask(existingPage.id, issue, existingPage, defaultProject);
    } else {
      await createTask(tasksDatabaseId, issue, defaultProject);
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
