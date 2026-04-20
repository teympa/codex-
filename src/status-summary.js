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
    return ["context.md could not be read."];
  }
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

function shortIssueLine(issue, tracked) {
  const state = issue.state === "open" ? "open" : "closed";
  const title = issue.title || tracked.title;
  return `- #${issue.number} [${state}] ${title}`;
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

async function buildNotionTaskSummary(sources) {
  if (!process.env.NOTION_API_TOKEN) {
    return [
      "**Notion**",
      "- live status: disabled (set NOTION_API_TOKEN to enable)",
      `- Tasks DB: ${sources.notion.tasksDatabaseUrl}`,
      `- Projects DB: ${sources.notion.projectsDatabaseUrl}`,
      ...sources.github.trackedIssues.map(
        (tracked) => `- Task link for #${tracked.number}: ${tracked.notionTaskUrl}`
      ),
    ];
  }

  const taskDatabaseId = extractIdFromNotionUrl(sources.notion.tasksDatabaseUrl);
  const taskQuery = await queryNotionDatabase(taskDatabaseId);
  const counts = countTasksByStatus(taskQuery.results);
  const sampleTasks = taskQuery.results.slice(0, 5).map((page) => {
    const title = readTitleProperty(page.properties);
    const status = page.properties.Status?.select?.name || "Unknown";
    return `- ${title} [${status}]`;
  });

  return [
    "**Notion**",
    `- live status: enabled`,
    `- total tasks: ${taskQuery.results.length}`,
    ...Object.entries(counts).map(([status, count]) => `- ${status}: ${count}`),
    `- Tasks DB: ${sources.notion.tasksDatabaseUrl}`,
    `- Projects DB: ${sources.notion.projectsDatabaseUrl}`,
    ...sampleTasks,
  ];
}

function extractIdFromNotionUrl(url) {
  const match = url.match(/([a-f0-9]{32})/i);
  if (!match) {
    throw new Error(`Could not extract Notion id from url: ${url}`);
  }
  return match[1];
}

async function buildStatusSummary() {
  const sources = readJson(STATUS_SOURCES_PATH);
  const currentFocus = readContextSection("Current Focus");
  const nextSteps = readContextSection("Immediate Next Steps");
  const issueResults = await Promise.all(
    sources.github.trackedIssues.map(async (tracked) => {
      const issue = await fetchIssue(sources.github.repository, tracked.number);
      return { tracked, issue };
    })
  );

  const openIssues = issueResults.filter(({ issue }) => issue.state === "open");
  const closedIssues = issueResults.filter(({ issue }) => issue.state !== "open");
  const notionLines = await buildNotionTaskSummary(sources);

  const lines = [
    "**Context**",
    ...currentFocus.map((line) => line),
    "",
    "**Next Steps**",
    ...nextSteps.map((line) => line),
    "",
    `**GitHub (${sources.github.repository})**`,
    `- open: ${openIssues.length}`,
    `- closed: ${closedIssues.length}`,
    ...issueResults.map(({ tracked, issue }) => shortIssueLine(issue, tracked)),
    "",
    ...notionLines,
  ];

  return lines.join("\n");
}

module.exports = {
  buildStatusSummary,
};
