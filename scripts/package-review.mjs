import { createReadStream, createWriteStream } from "node:fs";
import { readdir, stat, unlink } from "node:fs/promises";
import { createHash } from "node:crypto";
import { relative, resolve } from "node:path";
import yazl from "yazl";

const root = process.cwd();
const outPath = resolve(root, "food-engines-review.zip");
const forbiddenSegments = new Set([
  "node_modules",
  "dist",
  ".git",
  ".vite",
  "coverage",
  ".cache",
  "tmp",
  "temp",
  "internal"
]);

const requiredFiles = [
  ".gitignore",
  "index.html",
  "LICENSE",
  "NOTICE.md",
  "README.md",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "vite.config.ts",
  "BUILD_LOG_FOOD_ENGINES.txt",
  "BUILD_RECEIPT_FOOD_ENGINES.md",
  "PACKAGE_VERIFY_FOOD_ENGINES.md",
  "PLAYTEST_REPORT_FOOD_ENGINES.md"
];

const requiredScreenshots = [
  "output/playwright/food-engines-title.png",
  "output/playwright/food-engines-board.png",
  "output/playwright/food-engines-planting.png",
  "output/playwright/food-engines-engine-built.png",
  "output/playwright/food-engines-town-request.png",
  "output/playwright/food-engines-ending.png"
];

await unlink(outPath).catch(() => {});

const files = [];
await walk(root, files);
const entries = files
  .map((file) => toEntry(file))
  .filter((entry) => shouldInclude(entry))
  .sort((a, b) => a.localeCompare(b));

for (const required of [...requiredFiles, ...requiredScreenshots]) {
  if (!entries.includes(required)) {
    throw new Error(`Required review package file missing: ${required}`);
  }
}

validateEntries(entries);
await writeZip(entries);
const hash = await sha256(outPath);
console.log(`Package: ${outPath}`);
console.log(`Entries: ${entries.length}`);
console.log(`Backslash paths: ${entries.filter((entry) => entry.includes("\\")).length}`);
console.log(`SHA-256: ${hash}`);

async function walk(dir, files) {
  const names = await readdir(dir);
  for (const name of names) {
    const full = resolve(dir, name);
    const entry = toEntry(full);
    if (!shouldDescend(entry)) {
      continue;
    }
    const info = await stat(full);
    if (info.isDirectory()) {
      await walk(full, files);
    } else if (info.isFile()) {
      files.push(full);
    }
  }
}

function toEntry(file) {
  return relative(root, file).replaceAll("\\", "/");
}

function shouldDescend(entry) {
  if (!entry || entry === ".") {
    return true;
  }
  const segments = entry.split("/");
  return !segments.some((segment) => forbiddenSegments.has(segment));
}

function shouldInclude(entry) {
  if (!shouldDescend(entry)) {
    return false;
  }
  if (entry === "food-engines-review.zip") {
    return false;
  }
  if (entry === "Instructions.txt") {
    return false;
  }
  if (entry.endsWith(".zip")) {
    return false;
  }
  if (entry.endsWith(".log")) {
    return false;
  }
  return true;
}

function validateEntries(entryList) {
  for (const entry of entryList) {
    if (entry.includes("\\")) {
      throw new Error(`Backslash path rejected: ${entry}`);
    }
    if (entry.startsWith("/") || /^[A-Za-z]:/.test(entry)) {
      throw new Error(`Absolute path rejected: ${entry}`);
    }
    if (entry.split("/").includes("..")) {
      throw new Error(`Traversal path rejected: ${entry}`);
    }
    if (!shouldDescend(entry)) {
      throw new Error(`Forbidden path rejected: ${entry}`);
    }
  }
}

function writeZip(entryList) {
  return new Promise((resolvePromise, reject) => {
    const zip = new yazl.ZipFile();
    const output = createWriteStream(outPath);
    output.on("close", resolvePromise);
    output.on("error", reject);
    zip.outputStream.on("error", reject);
    zip.outputStream.pipe(output);
    for (const entry of entryList) {
      zip.addFile(resolve(root, entry), entry);
    }
    zip.end();
  });
}

function sha256(file) {
  return new Promise((resolvePromise, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(file);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolvePromise(hash.digest("hex")));
    stream.on("error", reject);
  });
}
