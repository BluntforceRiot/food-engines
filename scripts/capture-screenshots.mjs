import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { assertNoHorizontalOverflow, startVite, stopServer, waitForHttp } from "./browser-utils.mjs";

const outDir = "output/playwright";
const server = startVite(5192);
let browser;

try {
  await mkdir(outDir, { recursive: true });
  await waitForHttp(server.url);
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(server.url, { waitUntil: "networkidle" });
  await page.evaluate(() => window.FoodEnginesTest?.reset());
  await page.waitForSelector('[data-screen="title"]');
  await page.screenshot({ path: `${outDir}/food-engines-title.png`, fullPage: true });

  await page.click('[data-action="start"]');
  await page.waitForSelector('[data-screen="game"]');
  await assertNoHorizontalOverflow(page, "board screenshot");
  await page.screenshot({ path: `${outDir}/food-engines-board.png`, fullPage: true });

  await page.click('[data-plot="0"]');
  await page.click('[data-plot="0"]');
  await page.screenshot({ path: `${outDir}/food-engines-planting.png`, fullPage: true });

  await page.click('[data-action="end-day"]');
  await page.click('[data-action="end-day"]');
  await page.click('[data-plot="0"]');
  await page.click('[data-engine="compost"]');
  await page.screenshot({ path: `${outDir}/food-engines-engine-built.png`, fullPage: true });

  await page.screenshot({ path: `${outDir}/food-engines-town-request.png`, fullPage: true });

  await page.evaluate(() => window.FoodEnginesTest.forceEnding());
  await page.waitForSelector('[data-screen="ending"]');
  await page.screenshot({ path: `${outDir}/food-engines-ending.png`, fullPage: true });

  console.log(`Screenshots written to ${outDir}`);
} finally {
  if (browser) {
    await browser.close();
  }
  stopServer(server.child);
}

