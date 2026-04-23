const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const NODE_BIN = process.execPath;
const PROPOSALS_DIR = path.resolve(ROOT_DIR, "drafts", "proposals");
const SPECS_DIR = path.resolve(ROOT_DIR, "drafts", "specs");
const ISSUE_SEEDS_DIR = path.resolve(ROOT_DIR, "drafts", "issue-seeds");

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

function filePathFor(dirPath, title, suffix = "") {
  return path.join(dirPath, `${todayStamp()}-${slugify(title)}${suffix}.md`);
}

function relativePath(filePath) {
  return path.relative(ROOT_DIR, filePath) || filePath;
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help === "true" || args.h === "true") {
    console.log(
      [
        "Usage:",
        "  npm run bootstrap:project -- --title \"Project Name\" [options]",
        "",
        "Options:",
        "  --title <text>       Project title (required)",
        "  --project <text>     Project name",
        "  --genre <text>       Game genre",
        "  --platform <text>    Target platform",
        "  --audience <text>    Target audience",
        "  --coreHook <text>    Core hook or selling point",
        "  --mode <text>        Solo / multiplayer / co-op etc.",
      ].join("\n")
    );
    return;
  }

  const title = requireValue(args, "title");
  const proposalArgs = ["--title", title];
  const mappings = [
    ["project", "project"],
    ["genre", "genre"],
    ["platform", "platform"],
    ["audience", "audience"],
    ["coreHook", "coreHook"],
    ["mode", "mode"],
  ];

  for (const [argKey, cliKey] of mappings) {
    if (args[argKey]) {
      proposalArgs.push(`--${cliKey}`, args[argKey]);
    }
  }

  runNodeScript(path.resolve(__dirname, "generate-proposal.js"), proposalArgs);

  const proposalPath = filePathFor(PROPOSALS_DIR, title);
  if (!fs.existsSync(proposalPath)) {
    throw new Error(`Proposal file not found after generation: ${proposalPath}`);
  }

  runNodeScript(path.resolve(__dirname, "generate-spec-from-proposal.js"), [
    "--file",
    proposalPath,
  ]);

  runNodeScript(path.resolve(__dirname, "generate-issue-seeds.js"), [
    "--file",
    proposalPath,
  ]);

  const specPath = filePathFor(SPECS_DIR, title, "-spec");
  const issueSeedsPath = filePathFor(ISSUE_SEEDS_DIR, title, "-issue-seeds");

  console.log("Project bootstrap completed.");
  console.log(`- proposal: ${relativePath(proposalPath)}`);
  console.log(`- spec: ${relativePath(specPath)}`);
  console.log(`- issue seeds: ${relativePath(issueSeedsPath)}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
