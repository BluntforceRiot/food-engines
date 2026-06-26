import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const zipPath = resolve(root, "food-engines-review.zip");
const reportPath = resolve(root, "PACKAGE_VERIFY_FOOD_ENGINES.md");
const forbiddenSegments = new Set([
  "node_modules",
  "dist",
  ".git",
  ".vite",
  "coverage",
  ".cache",
  "tmp",
  "temp"
]);

const hash = await sha256(zipPath);
const entries = listEntries(zipPath);
const entryAudit = auditEntries(entries);

const extractRoot = await mkdtemp(join(tmpdir(), "food-engines-extract-"));
let result = "PASS";
const sections = [];

try {
  const extract = run("tar", ["-xf", zipPath, "-C", extractRoot], root);
  sections.push(section("Extract ZIP", extract));
  if (extract.status !== 0) {
    result = "FAIL";
  }

  const commands = [
    ["npm ci", npmCommand(), ["ci"]],
    ["npm run typecheck", npmCommand(), ["run", "typecheck"]],
    ["npm run build", npmCommand(), ["run", "build"]],
    ["npm audit --audit-level=moderate", npmCommand(), ["audit", "--audit-level=moderate"]],
    ["npm run playtest", npmCommand(), ["run", "playtest"]]
  ];

  for (const [label, command, args] of commands) {
    if (result === "FAIL") {
      break;
    }
    const commandResult = run(command, args, extractRoot);
    sections.push(section(label, commandResult));
    if (commandResult.status !== 0) {
      result = "FAIL";
    }
  }
} finally {
  await rm(extractRoot, { recursive: true, force: true });
}

if (entryAudit.bad.length > 0) {
  result = "FAIL";
}

const report = [
  "# Food Engines Package Verification",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "## Archive",
  "",
  `- ZIP: ${zipPath}`,
  `- SHA-256: ${hash}`,
  `- Entry count: ${entries.length}`,
  `- Backslash paths: ${entryAudit.backslashes}`,
  `- Absolute paths: ${entryAudit.absolute}`,
  `- Traversal paths: ${entryAudit.traversal}`,
  `- Forbidden dependency/build/cache/git/temp paths: ${entryAudit.forbidden}`,
  "",
  "## Exact Extracted-ZIP Verification",
  "",
  ...sections,
  "",
  "## Result",
  "",
  result === "PASS"
    ? "PASS. The extracted package installed, typechecked, built, audited, and passed the browser smoke playtest."
    : "FAIL. See command output above."
].join("\n");

await writeFile(reportPath, report, "utf8");
console.log(`Package verification ${result.toLowerCase()}: ${zipPath}`);
console.log(`Entries: ${entries.length}`);
console.log(`Backslash paths: ${entryAudit.backslashes}`);
console.log(`SHA-256: ${hash}`);
console.log(`Report: ${reportPath}`);

if (result !== "PASS") {
  process.exitCode = 1;
}

function npmCommand() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function listEntries(file) {
  const result = run("tar", ["-tf", file], root);
  if (result.status !== 0) {
    throw new Error(`Unable to list ZIP entries:\n${result.output}`);
  }
  return result.output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function auditEntries(entryList) {
  const bad = [];
  let backslashes = 0;
  let absolute = 0;
  let traversal = 0;
  let forbidden = 0;
  for (const entry of entryList) {
    if (entry.includes("\\")) {
      backslashes += 1;
      bad.push(entry);
    }
    if (entry.startsWith("/") || /^[A-Za-z]:/.test(entry)) {
      absolute += 1;
      bad.push(entry);
    }
    if (entry.split("/").includes("..")) {
      traversal += 1;
      bad.push(entry);
    }
    if (entry.split("/").some((segment) => forbiddenSegments.has(segment))) {
      forbidden += 1;
      bad.push(entry);
    }
  }
  return { bad, backslashes, absolute, traversal, forbidden };
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    shell: false,
    env: { ...process.env, BROWSER: "none" },
    maxBuffer: 1024 * 1024 * 10
  });
  return {
    status: result.status ?? 1,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim()
  };
}

function section(label, commandResult) {
  return [
    `### ${label}`,
    "",
    `Exit code: ${commandResult.status}`,
    "",
    "~~~text",
    commandResult.output || "(no output)",
    "~~~",
    ""
  ].join("\n");
}

function sha256(file) {
  return new Promise((resolvePromise, reject) => {
    const hashStream = createHash("sha256");
    const stream = createReadStream(file);
    stream.on("data", (chunk) => hashStream.update(chunk));
    stream.on("end", () => resolvePromise(hashStream.digest("hex")));
    stream.on("error", reject);
  });
}

