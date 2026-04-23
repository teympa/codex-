const path = require("path");
const { spawnSync } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const NODE_BIN = process.execPath;

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

function requireValue(args, key) {
  const value = args[key];
  if (!value || value === "true") {
    throw new Error(`--${key} is required`);
  }
  return value.trim();
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function todayStamp() {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

function runNodeScript(scriptPath, args) {
  const result = spawnSync(NODE_BIN, [scriptPath, ...args], {
    cwd: ROOT_DIR,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(
      result.stderr?.trim() || result.stdout?.trim() || `Script failed: ${scriptPath}`
    );
  }

  return result.stdout.trim();
}

function printUsage() {
  console.log(
    [
      "Usage:",
      "  npm run apply:bootstrap -- --title \"Project Name\" [--apply]",
      "",
      "Default mode is dry-run.",
      "",
      "This command expects these generated files to already exist:",
      "- drafts/specs/YYYYMMDD-project-name-spec.md",
      "- drafts/issue-seeds/YYYYMMDD-project-name-issue-seeds.md",
    ].join("\n")
  );
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help === "true" || args.h === "true") {
    printUsage();
    return;
  }

  const title = requireValue(args, "title");
  const baseName = `${todayStamp()}-${slugify(title)}`;
  const specFile = `${baseName}-spec.md`;
  const issueSeedFile = `${baseName}-issue-seeds.md`;
  const apply = args.apply === "true";

  const notionArgs = ["--file", specFile];
  const githubArgs = ["--file", issueSeedFile];

  if (apply) {
    notionArgs.push("--apply");
    githubArgs.push("--apply");
  }

  const notionOutput = runNodeScript(
    path.resolve(__dirname, "create-notion-spec-from-draft.js"),
    notionArgs
  );
  const githubOutput = runNodeScript(
    path.resolve(__dirname, "create-github-issues-from-seeds.js"),
    githubArgs
  );

  console.log(apply ? "Bootstrap apply completed." : "Bootstrap dry-run completed.");
  console.log("");
  console.log(`[Notion Specs]`);
  console.log(notionOutput);
  console.log("");
  console.log(`[GitHub Issues]`);
  console.log(githubOutput);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  printUsage();
  process.exit(1);
}
