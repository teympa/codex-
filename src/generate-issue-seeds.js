const fs = require("fs");
const path = require("path");

const PROPOSALS_DIR = path.resolve(__dirname, "..", "drafts", "proposals");
const OUTPUT_DIR = path.resolve(__dirname, "..", "drafts", "issue-seeds");

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

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function resolveProposalPath(input) {
  const directPath = path.resolve(process.cwd(), input);
  if (fs.existsSync(directPath)) {
    return directPath;
  }

  const proposalPath = path.join(PROPOSALS_DIR, input);
  if (fs.existsSync(proposalPath)) {
    return proposalPath;
  }

  throw new Error(`Proposal file not found: ${input}`);
}

function readProposalTitle(text, fallbackName) {
  const firstHeading = text
    .split(/\r?\n/)
    .find((line) => line.trim().startsWith("# "));

  if (firstHeading) {
    return firstHeading.replace(/^#\s+/, "").trim();
  }

  return fallbackName.replace(/\.md$/i, "");
}

function extractIssueSeeds(text) {
  const lines = text.split(/\r?\n/);
  const startIndex = lines.findIndex((line) => line.trim() === "## GitHub Issue Seeds");

  if (startIndex === -1) {
    return [];
  }

  const collected = [];
  for (let i = startIndex + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.startsWith("## ")) {
      break;
    }

    const match = line.match(/^-\s+\[(?: |x)\]\s+(.+)$/i);
    if (match) {
      collected.push(match[1].trim());
    }
  }

  return collected;
}

function buildIssueSeedMarkdown({ proposalTitle, proposalPath, seeds }) {
  const relativeProposalPath = path.relative(path.resolve(__dirname, ".."), proposalPath) || proposalPath;

  return [
    `# Issue Seeds For ${proposalTitle}`,
    "",
    "## Source",
    "",
    `- Proposal: ${relativeProposalPath}`,
    `- Generated: ${new Date().toISOString().slice(0, 10)}`,
    `- Seed Count: ${seeds.length}`,
    "",
    "## Suggested Issues",
    "",
    ...seeds.flatMap((seed, index) => [
      `### ${String(index + 1).padStart(2, "0")}. ${seed}`,
      "",
      `**Suggested Title**`,
      "",
      `${proposalTitle}: ${seed}`,
      "",
      "**Suggested Body**",
      "",
      "```md",
      "# Goal",
      "",
      `- ${seed}`,
      "",
      "# Background",
      "",
      `- Derived from proposal: ${proposalTitle}`,
      "",
      "# Done Criteria",
      "",
      "- [ ] Scope is clarified",
      "- [ ] Output or implementation target is defined",
      "- [ ] Follow-up dependencies are identified",
      "",
      "# Related Links",
      "",
      `- Proposal: ${relativeProposalPath}`,
      "```",
      "",
    ]),
  ].join("\n");
}

function printUsage() {
  console.log(
    [
      "Usage:",
      "  npm run generate:issue-seeds -- --file <proposal-file>",
      "",
      "Examples:",
      "  npm run generate:issue-seeds -- --file 20260423-neon-courier.md",
      "  npm run generate:issue-seeds -- --file drafts/proposals/20260423-neon-courier.md",
    ].join("\n")
  );
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help === "true" || args.h === "true") {
    printUsage();
    return;
  }

  const fileArg = requireValue(args, "file");
  const proposalPath = resolveProposalPath(fileArg);
  const proposalText = fs.readFileSync(proposalPath, "utf8");
  const proposalTitle = readProposalTitle(proposalText, path.basename(proposalPath));
  const seeds = extractIssueSeeds(proposalText);

  if (seeds.length === 0) {
    throw new Error("No issue seeds found in proposal.");
  }

  ensureDir(OUTPUT_DIR);

  const fileName = `${todayStamp()}-${slugify(proposalTitle)}-issue-seeds.md`;
  const outputPath = path.join(OUTPUT_DIR, fileName);

  if (fs.existsSync(outputPath)) {
    throw new Error(`Issue seed file already exists: ${outputPath}`);
  }

  const markdown = buildIssueSeedMarkdown({
    proposalTitle,
    proposalPath,
    seeds,
  });

  fs.writeFileSync(outputPath, markdown, "utf8");

  console.log(`Created: ${outputPath}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  printUsage();
  process.exit(1);
}
