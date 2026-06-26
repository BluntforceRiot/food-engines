import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

export function startVite(port = 5191) {
  const viteBin = join(process.cwd(), "node_modules", "vite", "bin", "vite.js");
  if (!existsSync(viteBin)) {
    throw new Error(`Vite executable not found at ${viteBin}. Run npm install first.`);
  }
  const child = spawn(
    process.execPath,
    [viteBin, "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
    {
      cwd: process.cwd(),
      env: { ...process.env, BROWSER: "none" },
      stdio: ["ignore", "pipe", "pipe"]
    }
  );

  let output = "";
  child.stdout.on("data", (chunk) => {
    output += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    output += chunk.toString();
  });

  return { child, output: () => output, url: `http://127.0.0.1:${port}/` };
}

export async function waitForHttp(url, timeoutMs = 20000) {
  const start = Date.now();
  let lastError = "";
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await delay(250);
  }
  throw new Error(`Timed out waiting for ${url}: ${lastError}`);
}

export function stopServer(child) {
  if (!child.killed) {
    child.kill();
  }
}

export function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function assertNoHorizontalOverflow(page, label) {
  const result = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth
  }));
  const overflow = Math.max(result.scrollWidth, result.bodyScrollWidth) - result.width;
  if (overflow > 2) {
    throw new Error(`${label} has horizontal overflow of ${overflow}px`);
  }
}
