const fs = require("fs");
const path = require("path");

const STATUS_SOURCES_PATH = path.resolve(__dirname, "..", "config", "status-sources.json");
const CONTEXT_PATH = path.resolve(__dirname, "..", "context.md");
const NOTION_API_VERSION = "2022-06-28";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readContextSection(sectionTitle) {
  try {
    const text = fs.readFileSync(CONTEXT_PATH, "utf8");
    const lines = text.split(/\r?\n/);
    const header = `## ${sectionTitle}`;
    const startIndex = lines.findIndex((line) => line.trim() === header);

    if (startIndex === -1) {
      return [];
    }

    const collected = [];
    for (let i = startIndex + 1; i < lines.length; i += 1) {
      const line = lines[i];
      if (line.startsWith("## ")) {
        break;
      }
      if (line.trim()) {
        collected.push(line);
      }
    }
    return collected;
  } catch (error) {
    return [];
  }
}

function readSubsection(sectionTitle, subsectionTitle) {
  const lines = readContextSection(sectionTitle);
  if (lines.length === 0) {
    return [];
  }

  const header = `### ${subsectionTitle}`;
  const startIndex = lines.findIndex((line) => line.trim() === header);

  if (startIndex === -1) {
    return [];
  }

  const collected = [];
  for (let i = startIndex + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.startsWith("### ")) {
      break;
    }
    if (line.trim()) {
      collected.push(line);
    }
  }

  return collected;
}

function cleanBullet(line) {
  return line.replace(/^[-*]\s*/, "").trim();
}

function cleanNumbered(line) {
  return line.replace(/^\d+\.\s*/, "").trim();
}

async function fetchIssue(repository, number) {
  const response = await fetch(`https://api.github.com/repos/${repository}/issues/${number}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "codex-discord-bridge",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub issue fetch failed for #${number}: ${response.status}`);
  }

  return response.json();
}

function notionHeaders() {
  return {
    Authorization: `Bearer ${process.env.NOTION_API_TOKEN}`,
    "Notion-Version": NOTION_API_VERSION,
    "Content-Type": "application/json",
  };
}

async function queryNotionDatabase(databaseId) {
  const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: "POST",
    headers: notionHeaders(),
    body: JSON.stringify({
      page_size: 100,
    }),
  });

  if (!response.ok) {
    throw new Error(`Notion query failed: ${response.status}`);
  }

  return response.json();
}

function readTitleProperty(properties) {
  const titleProp = Object.values(properties).find((prop) => prop.type === "title");
  if (!titleProp) {
    return "(untitled)";
  }

  return titleProp.title.map((part) => part.plain_text).join("") || "(untitled)";
}

function countTasksByStatus(results) {
  const counts = {};

  for (const page of results) {
    const statusProp = page.properties.Status;
    const status = statusProp?.select?.name || "Unknown";
    counts[status] = (counts[status] || 0) + 1;
  }

  return counts;
}

function extractIdFromNotionUrl(url) {
  const match = url.match(/([a-f0-9]{32})/i);
  if (!match) {
    throw new Error(`Could not extract Notion id from url: ${url}`);
  }
  return match[1];
}

function formatIssueList(issueResults) {
  const openIssues = issueResults.filter(({ issue }) => issue.state === "open");

  if (openIssues.length === 0) {
    return ["- open issues: 0", "- tracked backlog is fully closed"];
  }

  return [
    `- open issues: ${openIssues.length}`,
    ...openIssues.slice(0, 3).map(({ issue }) => `- #${issue.number} ${issue.title}`),
  ];
}

async function buildNotionTaskSummary(sources) {
  if (!process.env.NOTION_API_TOKEN) {
    return {
      lines: [
        "- live status: disabled",
        `- Tasks DB: ${sources.notion.tasksDatabaseUrl}`,
      ],
      spotlight: null,
    };
  }

  const taskDatabaseId = extractIdFromNotionUrl(sources.notion.tasksDatabaseUrl);
  const taskQuery = await queryNotionDatabase(taskDatabaseId);
  const counts = countTasksByStatus(taskQuery.results);
  const orderedStatuses = ["Inbox", "Planned", "In Progress", "Review", "Blocked", "Done"];
  const countParts = orderedStatuses
    .filter((status) => counts[status])
    .map((status) => `${status}:${counts[status]}`);

  const spotlightTask = taskQuery.results.find((page) => {
    const status = page.properties.Status?.select?.name;
    return status && status !== "Done";
  });

  return {
    lines: [
      "- live status: enabled",
      `- total tasks: ${taskQuery.results.length}`,
      `- status: ${countParts.join(" / ") || "none"}`,
    ],
    spotlight: spotlightTask
      ? `${readTitleProperty(spotlightTask.properties)} [${
          spotlightTask.properties.Status?.select?.name || "Unknown"
        }]`
      : null,
  };
}

async function buildStatusSummary() {
  const sources = readJson(STATUS_SOURCES_PATH);
  const currentFocus = readContextSection("Current Focus").map(cleanBullet);
  const nextPriority = readSubsection("Execution Status", "Next Priority").map(cleanBullet);
  const nextSteps = readContextSection("Immediate Next Steps").map(cleanNumbered);
  const issueResults = await Promise.all(
    sources.github.trackedIssues.map(async (tracked) => {
      const issue = await fetchIssue(sources.github.repository, tracked.number);
      return { tracked, issue };
    })
  );
  const notionSummary = await buildNotionTaskSummary(sources);

  const lines = [
    "**Status**",
    `- focus: ${currentFocus[0] || "No current focus"}`,
    `- next priority: ${nextPriority[0] || nextSteps[0] || "No next priority"}`,
    "",
    "**Next**",
    ...nextSteps.slice(0, 3).map((step) => `- ${step}`),
    "",
    `**GitHub (${sources.github.repository})**`,
    ...formatIssueList(issueResults),
    "",
    "**Notion**",
    ...notionSummary.lines,
  ];

  if (notionSummary.spotlight) {
    lines.push(`- spotlight: ${notionSummary.spotlight}`);
  }

  return lines.join("\n");
}

module.exports = {
  buildStatusSummary,
};
