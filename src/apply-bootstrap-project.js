const path = require("path");
const { spawnSync } = require("child_process");
require("dotenv").config();

const ROOT_DIR = path.resolve(__dirname, "..");
const NODE_BIN = process.execPath;
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

function firstValue(args, keys) {
  for (const key of keys) {
    const value = args[key];
    if (value && value !== "true") {
      return value.trim();
    }
  }

  return "";
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function resolveExistingFile(dirPath, input, label) {
  const directPath = path.resolve(process.cwd(), input);
  if (path.isAbsolute(input) && path.isAbsolute(directPath) && require("fs").existsSync(directPath)) {
    return directPath;
  }

  if (require("fs").existsSync(directPath)) {
    return directPath;
  }

  const localPath = path.join(dirPath, input);
  if (require("fs").existsSync(localPath)) {
    return localPath;
  }

  throw new Error(`${label} file not found: ${input}`);
}

function findLatestGeneratedFile(dirPath, title, suffix) {
  const fs = require("fs");
  const slug = slugify(title);
  const pattern = new RegExp(`^\\d{8}-${escapeRegExp(slug)}${escapeRegExp(suffix)}\\.md$`, "i");

  const matchingFiles = fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && pattern.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => b.localeCompare(a));

  if (matchingFiles.length === 0) {
    throw new Error(
      `No generated file found for "${title}" in ${path.relative(ROOT_DIR, dirPath)} matching *-${slug}${suffix}.md`
    );
  }

  return path.join(dirPath, matchingFiles[0]);
}

function resolveBootstrapArtifacts(args) {
  const title = firstValue(args, ["title"]);
  const specFile = firstValue(args, ["specFile", "spec_file", "spec-file"]);
  const issueSeedFile = firstValue(args, [
    "issueSeedFile",
    "issue_seed_file",
    "issue-seed-file",
  ]);
  const hasSpecFile = Boolean(specFile);
  const hasIssueSeedFile = Boolean(issueSeedFile);

  if (hasSpecFile && hasIssueSeedFile) {
    return {
      specPath: resolveExistingFile(SPECS_DIR, specFile, "Spec"),
      issueSeedPath: resolveExistingFile(ISSUE_SEEDS_DIR, issueSeedFile, "Issue seed"),
    };
  }

  if (!title) {
    throw new Error(
      "--title is required unless both --specFile and --issueSeedFile are provided"
    );
  }

  return {
    specPath: hasSpecFile
      ? resolveExistingFile(SPECS_DIR, specFile, "Spec")
      : findLatestGeneratedFile(SPECS_DIR, title, "-spec"),
    issueSeedPath: hasIssueSeedFile
      ? resolveExistingFile(ISSUE_SEEDS_DIR, issueSeedFile, "Issue seed")
      : findLatestGeneratedFile(ISSUE_SEEDS_DIR, title, "-issue-seeds"),
  };
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

function relativePath(filePath) {
  return path.relative(ROOT_DIR, filePath) || filePath;
}

function validateApplyEnvironment() {
  const missing = [];

  if (!process.env.NOTION_API_TOKEN) {
    missing.push("NOTION_API_TOKEN");
  }

  if (!process.env.GITHUB_TOKEN) {
    missing.push("GITHUB_TOKEN");
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables for --apply: ${missing.join(", ")}`
    );
  }
}

function printUsage() {
  console.log(
    [
      "Usage:",
      "  npm run apply:bootstrap -- --title \"Project Name\" [--apply]",
      "  npm run apply:bootstrap -- --specFile 20260424-project-name-spec.md --issueSeedFile 20260424-project-name-issue-seeds.md [--apply]",
      "  npm run apply:bootstrap -- --spec_file 20260424-project-name-spec.md --issue_seed_file 20260424-project-name-issue-seeds.md [--apply]",
      "",
      "Default mode is dry-run.",
      "",
      "If only --title is given, the latest matching generated files are used.",
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

  const apply = args.apply === "true";
  const { specPath, issueSeedPath } = resolveBootstrapArtifacts(args);

  if (apply) {
    validateApplyEnvironment();
  }

  const notionArgs = ["--file", specPath];
  const githubArgs = ["--file", issueSeedPath];

  if (apply) {
    notionArgs.push("--apply");
    githubArgs.push("--apply");
  }

  console.log(apply ? "Bootstrap apply preflight." : "Bootstrap dry-run preflight.");
  console.log("");
  console.log(`- mode: ${apply ? "apply" : "dry-run"}`);
  console.log(`- spec file: ${relativePath(specPath)}`);
  console.log(`- issue seeds file: ${relativePath(issueSeedPath)}`);
  console.log("");

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
  console.log(`- spec file: ${relativePath(specPath)}`);
  console.log(`- issue seeds file: ${relativePath(issueSeedPath)}`);
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
