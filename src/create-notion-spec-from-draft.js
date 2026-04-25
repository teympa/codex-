const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const ROOT_DIR = path.resolve(__dirname, "..");
const STATUS_SOURCES_PATH = path.resolve(__dirname, "..", "config", "status-sources.json");
const SPECS_DIR = path.resolve(__dirname, "..", "drafts", "specs");
const NOTION_API_VERSION = "2022-06-28";
const APPLY_MODE = process.argv.includes("--apply");

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

function resolveSpecPath(input) {
  const directPath = path.resolve(process.cwd(), input);
  if (fs.existsSync(directPath)) {
    return directPath;
  }

  const localPath = path.join(SPECS_DIR, input);
  if (fs.existsSync(localPath)) {
    return localPath;
  }

  throw new Error(`Spec draft file not found: ${input}`);
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
    throw new Error("NOTION_API_TOKEN is required for apply mode.");
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

function titleFromLines(lines, fallbackName) {
  const heading = lines.find((line) => line.trim().startsWith("# "));
  if (!heading) {
    return fallbackName.replace(/\.md$/i, "");
  }

  return heading.replace(/^#\s+/, "").replace(/^Spec:\s*/i, "").trim();
}

function richText(content) {
  return [
    {
      type: "text",
      text: {
        content: content.slice(0, 2000),
      },
    },
  ];
}

function buildProperties(title) {
  return {
    Title: {
      title: richText(title),
    },
    Status: {
      select: {
        name: "Draft",
      },
    },
    "Spec Type": {
      select: {
        name: "Game Spec",
      },
    },
    Source: {
      select: {
        name: "Local Draft",
      },
    },
    Version: {
      rich_text: richText("0.1"),
    },
    "Last Reviewed": {
      date: {
        start: new Date().toISOString().slice(0, 10),
      },
    },
  };
}

function toNotionBlocks(lines) {
  const blocks = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    if (trimmed.startsWith("# ")) {
      blocks.push({
        object: "block",
        type: "heading_1",
        heading_1: {
          rich_text: richText(trimmed.replace(/^#\s+/, "")),
        },
      });
      continue;
    }

    if (trimmed.startsWith("## ")) {
      blocks.push({
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: richText(trimmed.replace(/^##\s+/, "")),
        },
      });
      continue;
    }

    if (trimmed.startsWith("### ")) {
      blocks.push({
        object: "block",
        type: "heading_3",
        heading_3: {
          rich_text: richText(trimmed.replace(/^###\s+/, "")),
        },
      });
      continue;
    }

    const bulletMatch = trimmed.match(/^-\s+(.+)$/);
    if (bulletMatch) {
      blocks.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: richText(bulletMatch[1]),
        },
      });
      continue;
    }

    const numberedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (numberedMatch) {
      blocks.push({
        object: "block",
        type: "numbered_list_item",
        numbered_list_item: {
          rich_text: richText(numberedMatch[1]),
        },
      });
      continue;
    }

    blocks.push({
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: richText(trimmed),
      },
    });
  }

  return blocks.slice(0, 100);
}

function relativePath(filePath) {
  return path.relative(ROOT_DIR, filePath) || filePath;
}

function previewLines(markdown) {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function printUsage() {
  console.log(
    [
      "Usage:",
      "  npm run create:notion-spec -- --file <spec-draft-file> [--apply]",
      "",
      "Examples:",
      "  npm run create:notion-spec -- --file 20260423-project-name-spec.md",
      "  npm run create:notion-spec -- --file 20260423-project-name-spec.md --apply",
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
  const specPath = resolveSpecPath(fileArg);
  const text = fs.readFileSync(specPath, "utf8");
  const lines = text.split(/\r?\n/);
  const title = titleFromLines(lines, path.basename(specPath));

  const sources = readJson(STATUS_SOURCES_PATH);
  const databaseId = extractIdFromNotionUrl(sources.notion.specsDatabaseUrl);
  const properties = buildProperties(title);
  const children = toNotionBlocks(lines);

  if (!APPLY_MODE) {
    console.log("[dry-run] create Notion spec");
    console.log(`- title: ${title}`);
    console.log(`- source file: ${relativePath(specPath)}`);
    console.log("- database: Specs");
    console.log("- body preview:");
    for (const line of previewLines(text)) {
      console.log(`  ${line}`);
    }
    console.log(`- blocks: ${children.length}`);
    console.log(`- database url: ${sources.notion.specsDatabaseUrl}`);
    return;
  }

  const result = await notionRequest("https://api.notion.com/v1/pages", {
    method: "POST",
    body: JSON.stringify({
      parent: {
        database_id: databaseId,
      },
      properties,
      children,
    }),
  });

  console.log(`created Notion spec: ${title}`);
  if (result.url) {
    console.log(result.url);
  }
}

main().catch((error) => {
  console.error(error.message);
  printUsage();
  process.exit(1);
});
