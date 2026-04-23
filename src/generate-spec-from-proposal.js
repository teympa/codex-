const fs = require("fs");
const path = require("path");

const PROPOSALS_DIR = path.resolve(__dirname, "..", "drafts", "proposals");
const OUTPUT_DIR = path.resolve(__dirname, "..", "drafts", "specs");

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

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
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

function splitLines(text) {
  return text.split(/\r?\n/);
}

function readTitle(lines, fallbackName) {
  const heading = lines.find((line) => line.trim().startsWith("# "));
  return heading ? heading.replace(/^#\s+/, "").trim() : fallbackName.replace(/\.md$/i, "");
}

function collectSection(lines, sectionTitle) {
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
    collected.push(line);
  }

  return trimEmptyEdges(collected);
}

function collectSubsection(lines, sectionTitle, subsectionTitle) {
  const section = collectSection(lines, sectionTitle);
  if (section.length === 0) {
    return [];
  }

  const header = `### ${subsectionTitle}`;
  const startIndex = section.findIndex((line) => line.trim() === header);
  if (startIndex === -1) {
    return [];
  }

  const collected = [];
  for (let i = startIndex + 1; i < section.length; i += 1) {
    const line = section[i];
    if (line.startsWith("### ")) {
      break;
    }
    collected.push(line);
  }

  return trimEmptyEdges(collected);
}

function trimEmptyEdges(lines) {
  let start = 0;
  let end = lines.length;

  while (start < end && !lines[start].trim()) {
    start += 1;
  }
  while (end > start && !lines[end - 1].trim()) {
    end -= 1;
  }

  return lines.slice(start, end);
}

function fallbackList(items, fallbackText) {
  return items.length > 0 ? items : [`- ${fallbackText}`];
}

function buildSpecMarkdown({ proposalPath, proposalTitle, lines }) {
  const concept = collectSection(lines, "Concept");
  const goals = collectSection(lines, "Goals");
  const coreLoop = collectSection(lines, "Core Loop");
  const scope = collectSection(lines, "Scope");
  const featureBreakdown = collectSection(lines, "Feature Breakdown");
  const risks = collectSection(lines, "Risks");
  const openQuestions = collectSection(lines, "Open Questions");
  const oneLiner = collectSubsection(lines, "Concept", "One-Liner");
  const pillars = collectSection(lines, "Pillars");

  return [
    `# Spec: ${proposalTitle}`,
    "",
    "## Background",
    "",
    ...fallbackList(oneLiner, "Proposal one-liner to be added."),
    "",
    ...fallbackList(concept.filter((line) => !line.startsWith("### ")), "Background context to be expanded from proposal."),
    "",
    "## Goal",
    "",
    ...fallbackList(goals, "Goal section to be expanded from proposal."),
    "",
    "## Scope",
    "",
    ...fallbackList(scope, "Scope to be defined from proposal."),
    "",
    "## Requirements",
    "",
    ...fallbackList(featureBreakdown, "Requirements to be detailed from proposal."),
    "",
    "## User Flow",
    "",
    ...fallbackList(coreLoop, "User flow to be derived from the core loop."),
    "",
    "## Functional Details",
    "",
    ...fallbackList(pillars, "Functional details and pillars to be elaborated."),
    "",
    "## Non-Functional Requirements",
    "",
    "- Performance expectations:",
    "- Platform constraints:",
    "- Tooling or asset pipeline constraints:",
    "",
    "## Risks",
    "",
    ...fallbackList(risks, "Risks to be reviewed."),
    "",
    "## Open Questions",
    "",
    ...fallbackList(openQuestions, "Open questions to be reviewed."),
    "",
    "## References",
    "",
    `- Proposal: ${path.relative(path.resolve(__dirname, ".."), proposalPath)}`,
    "",
    "## Change Log",
    "",
    `- ${new Date().toISOString().slice(0, 10)}: Initial spec draft generated from proposal`,
    "",
  ].join("\n");
}

function printUsage() {
  console.log(
    [
      "Usage:",
      "  npm run generate:spec -- --file <proposal-file>",
      "",
      "Examples:",
      "  npm run generate:spec -- --file 20260423-project-name.md",
      "  npm run generate:spec -- --file drafts/proposals/20260423-project-name.md",
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
  const text = fs.readFileSync(proposalPath, "utf8");
  const lines = splitLines(text);
  const proposalTitle = readTitle(lines, path.basename(proposalPath));

  ensureDir(OUTPUT_DIR);
  const fileName = `${todayStamp()}-${slugify(proposalTitle)}-spec.md`;
  const outputPath = path.join(OUTPUT_DIR, fileName);

  if (fs.existsSync(outputPath)) {
    throw new Error(`Spec draft already exists: ${outputPath}`);
  }

  const spec = buildSpecMarkdown({
    proposalPath,
    proposalTitle,
    lines,
  });

  fs.writeFileSync(outputPath, spec, "utf8");
  console.log(`Created: ${outputPath}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  printUsage();
  process.exit(1);
}
