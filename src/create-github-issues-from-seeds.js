const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const ROOT_DIR = path.resolve(__dirname, "..");
const STATUS_SOURCES_PATH = path.resolve(__dirname, "..", "config", "status-sources.json");
const ISSUE_SEEDS_DIR = path.resolve(__dirname, "..", "drafts", "issue-seeds");
const DRY_RUN = !process.argv.includes("--apply");

function parseArgs(argv) {
  const args = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      args[key] = "true";
      continue;
    }

    args[key] = value;
    i += 1;
  }

  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function requireValue(args, key) {
  const value = args[key];
  if (!value || value === "true") {
    throw new Error(`--${key} is required`);
  }
  return value.trim();
}

function resolveIssueSeedPath(input) {
  const directPath = path.resolve(process.cwd(), input);
  if (fs.existsSync(directPath)) {
    return directPath;
  }

  const localPath = path.join(ISSUE_SEEDS_DIR, input);
  if (fs.existsSync(localPath)) {
    return localPath;
  }

  throw new Error(`Issue seed file not found: ${input}`);
}

function parseIssueSeedMarkdown(text) {
  const lines = text.split(/\r?\n/);
  const issues = [];
  let current = null;
  let section = null;
  let inCodeFence = false;

  function finalizeCurrent() {
    if (current && current.title && current.bodyLines.length > 0) {
      issues.push({
        title: current.title,
        labels: current.labels,
        body: current.bodyLines.join("\n").trim(),
      });
    }
  }

  for (const line of lines) {
    if (/^###\s+\d+\.\s+/.test(line.trim())) {
      finalizeCurrent();
      current = {
        title: "",
        labels: [],
        bodyLines: [],
      };
      section = null;
      inCodeFence = false;
      continue;
    }

    if (!current) {
      continue;
    }

    if (line.trim() === "**Suggested Title**") {
      section = "title";
      continue;
    }

    if (line.trim() === "**Suggested Body**") {
      section = "body";
      continue;
    }

    if (line.trim() === "**Suggested Labels**") {
      section = "labels";
      continue;
    }

    if (section === "title") {
      if (!line.trim()) {
        continue;
      }
      current.title = line.trim();
      section = null;
      continue;
    }

    if (section === "labels") {
      if (!line.trim()) {
        continue;
      }
      current.labels = line
        .split(",")
        .map((label) => label.trim())
        .filter(Boolean);
      section = null;
      continue;
    }

    if (section === "body") {
      if (line.trim().startsWith("```")) {
        inCodeFence = !inCodeFence;
        continue;
      }

      if (inCodeFence) {
        current.bodyLines.push(line);
      }
    }
  }

  finalizeCurrent();
  return issues;
}

async function createIssue(repository, issue) {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN is required for apply mode.");
  }

  const response = await fetch(`https://api.github.com/repos/${repository}/issues`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      "User-Agent": "codex-github-issue-seed-creator",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: issue.title,
      body: issue.body,
      ...(issue.labels.length > 0 ? { labels: issue.labels } : {}),
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`GitHub issue creation failed: ${response.status} ${JSON.stringify(data)}`);
  }

  return data;
}

function relativePath(filePath) {
  return path.relative(ROOT_DIR, filePath) || filePath;
}

function previewText(value, maxLength = 160) {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) {
    return compact;
  }

  return `${compact.slice(0, maxLength - 3)}...`;
}

function printUsage() {
  console.log(
    [
      "Usage:",
      "  npm run create:github-issues -- --file <issue-seed-file> [--apply]",
      "",
      "Examples:",
      "  npm run create:github-issues -- --file 20260423-project-name-issue-seeds.md",
      "  npm run create:github-issues -- --file 20260423-project-name-issue-seeds.md --apply",
      "",
      "Default mode is dry-run.",
    ].join("\n")
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help === "true" || args.h === "true") {
    printUsage();
    return;
  }

  const fileArg = requireValue(args, "file");
  const filePath = resolveIssueSeedPath(fileArg);
  const markdown = fs.readFileSync(filePath, "utf8");
  const issues = parseIssueSeedMarkdown(markdown);

  if (issues.length === 0) {
    throw new Error("No suggested issues found in issue seed file.");
  }

  const sources = readJson(STATUS_SOURCES_PATH);
  const repository = sources.github.repository;

  if (DRY_RUN) {
    console.log(`[dry-run] create GitHub issues from ${relativePath(filePath)}`);
    console.log(`- repository: ${repository}`);
    for (const [index, issue] of issues.entries()) {
      console.log(`- #${index + 1} ${issue.title}`);
      console.log(`  labels: ${issue.labels.length > 0 ? issue.labels.join(", ") : "none"}`);
      console.log(`  body: ${previewText(issue.body)}`);
    }
    return;
  }

  const created = [];
  for (const issue of issues) {
    const result = await createIssue(repository, issue);
    created.push({
      number: result.number,
      title: result.title,
      url: result.html_url,
    });
  }

  console.log("created GitHub issues");
  for (const issue of created) {
    console.log(`- #${issue.number} ${issue.title} ${issue.url}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  printUsage();
  process.exit(1);
});
