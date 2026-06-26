import { chromium } from "playwright";
import { assertNoHorizontalOverflow, startVite, stopServer, waitForHttp } from "./browser-utils.mjs";

const server = startVite(5191);
const consoleErrors = [];
let browser;

try {
  console.log("Starting Vite preview...");
  try {
    await waitForHttp(server.url);
  } catch (error) {
    console.error(server.output());
    throw error;
  }
  console.log(`Opening browser at ${server.url}`);
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });

  await page.goto(server.url, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  console.log("Title loaded.");
  await page.waitForSelector('[data-screen="title"]');
  await expectText(page, "Food Engines");
  await assertNoHorizontalOverflow(page, "title 1280x720");

  await page.click('[data-action="start"]');
  await page.waitForSelector('[data-screen="game"]');
  console.log("Game started.");
  await expectText(page, "Town Request Board");
  await expectCount(page, "[data-plot]", 80);
  await assertNoHorizontalOverflow(page, "board 1280x720");

  await page.click('[data-plot="0"]');
  await page.click('[data-plot="0"]');
  await page.click('[data-action="end-day"]');
  await page.click('[data-action="end-day"]');
  await page.click('[data-plot="0"]');
  console.log("Crop planted, watered, advanced, harvested.");

  const freshFood = Number(await readStat(page, "Fresh"));
  if (!Number.isFinite(freshFood) || freshFood <= 0) {
    throw new Error("Tomatoes did not harvest into fresh food.");
  }

  await page.click('[data-engine="compost"]');
  console.log("Engine click sent.");
  const engineBuilt = await page.locator('[data-engine="compost"]').filter({ hasText: "Built" }).count();
  if (engineBuilt < 1) {
    throw new Error("Compost engine did not build.");
  }

  const firstRequest = page.locator("[data-request]").first();
  if ((await firstRequest.count()) > 0) {
    await firstRequest.click();
  }

  await advanceToEnding(page);
  await page.waitForSelector('[data-screen="ending"]');
  console.log("Ending reached.");
  await expectText(page, "Copy Recap");

  await page.setViewportSize({ width: 1440, height: 900 });
  await assertNoHorizontalOverflow(page, "ending 1440x900");

  if (consoleErrors.length > 0) {
    throw new Error(`Console errors:\n${consoleErrors.join("\n")}`);
  }

  console.log("Browser smoke checks passed.");
} finally {
  if (browser) {
    await browser.close();
  }
  stopServer(server.child);
}

async function expectText(page, text) {
  const count = await page.getByText(text, { exact: false }).count();
  if (count < 1) {
    throw new Error(`Expected text not found: ${text}`);
  }
}

async function expectCount(page, selector, expected) {
  const count = await page.locator(selector).count();
  if (count !== expected) {
    throw new Error(`Expected ${expected} matches for ${selector}, got ${count}.`);
  }
}

async function readStat(page, label) {
  return page.$$eval(
    ".stat-pill",
    (pills, statLabel) => {
      const match = pills.find((pill) => pill.querySelector("span")?.textContent?.trim() === statLabel);
      return match?.querySelector("strong")?.textContent?.trim() ?? "";
    },
    label
  );
}

async function advanceToEnding(page) {
  for (let i = 0; i < 25; i += 1) {
    if ((await page.locator('[data-screen="ending"]').count()) > 0) {
      return;
    }
    const endDay = page.locator('[data-action="end-day"]');
    if ((await endDay.count()) < 1) {
      break;
    }
    await endDay.click();
  }
}
