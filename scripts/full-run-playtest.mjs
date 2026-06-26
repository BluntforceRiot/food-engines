import { chromium } from "playwright";
import { assertNoHorizontalOverflow, startVite, stopServer, waitForHttp } from "./browser-utils.mjs";

const SAVE_KEY = "food-engines.currentRun.v1";
const server = startVite(5193);
const consoleErrors = [];
let browser;

const failureTitles = new Set([
  "Grocery Truck Dependency",
  "Pantry Failed To Launch",
  "Missed Demand Spiral",
  "Weather Ate The Farm",
  "Tomato Symbolism Could Not Feed The Town"
]);

const cropPlan = [
  "tomatoes",
  "wheat",
  "beans",
  "corn",
  "potatoes",
  "apples",
  "pumpkins",
  "lettuce"
];

const cropYield = {
  tomatoes: 4,
  corn: 6,
  beans: 4,
  potatoes: 5,
  lettuce: 3,
  wheat: 4,
  apples: 6,
  pumpkins: 7
};

const cropCost = {
  tomatoes: { money: 2, seeds: 1 },
  corn: { money: 3, seeds: 2 },
  beans: { money: 2, seeds: 1 },
  potatoes: { money: 3, seeds: 1 },
  lettuce: { money: 1, seeds: 1 },
  wheat: { money: 2, seeds: 1 },
  apples: { money: 5, seeds: 2 },
  pumpkins: { money: 4, seeds: 2 }
};

const enginePlan = [
  "rainBarrel",
  "seedShed",
  "compost",
  "well",
  "rootCellar",
  "farmStand",
  "csaBoard",
  "cannery",
  "bakery",
  "communityKitchen",
  "rotation"
];

try {
  console.log("Starting Vite preview for full-run balance probe...");
  try {
    await waitForHttp(server.url);
  } catch (error) {
    console.error(server.output());
    throw error;
  }

  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
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
  await page.waitForSelector('[data-screen="title"]');
  await page.click('[data-action="start"]');
  await page.waitForSelector('[data-screen="game"]');

  let guard = 0;
  while (guard < 520 && (await page.locator('[data-screen="ending"]').count()) === 0) {
    guard += 1;
    const game = await readGame(page);

    if (game.actionsLeft <= 0) {
      await endDay(page);
      continue;
    }

    if (await fillReadyRequest(page)) continue;
    if (await harvestReadyCrop(page)) continue;
    if (await preserveIfUseful(page)) continue;
    if (await sellIfUseful(page)) continue;
    if (await waterCrop(page)) continue;
    if (await plantUsefulCrop(page)) continue;
    if (await buildUsefulEngine(page)) continue;

    await endDay(page);
  }

  if ((await page.locator('[data-screen="ending"]').count()) === 0) {
    const stalled = await readGame(page);
    throw new Error(`Full-run probe stalled before ending: ${JSON.stringify(summarizeGame(stalled))}`);
  }
  await page.waitForSelector('[data-screen="ending"]');
  await assertNoHorizontalOverflow(page, "full-run ending 1440x900");

  const finalGame = await readGame(page);
  const ending = finalGame.ending;
  if (!ending) {
    throw new Error("Full-run probe reached ending screen without ending data.");
  }

  const summary = summarizeGame(finalGame);
  console.log(`Full-run summary: ${JSON.stringify(summary)}`);

  if (failureTitles.has(ending.title)) {
    throw new Error(`Reasonable 21-day strategy ended in failure title: ${ending.title}`);
  }
  if (ending.score < 900) {
    throw new Error(`Reasonable 21-day strategy score too low: ${ending.score}`);
  }
  if (finalGame.completedRequests < 2) {
    throw new Error(`Reasonable 21-day strategy completed too few requests: ${finalGame.completedRequests}`);
  }
  if (finalGame.foodSecurity < 45 || finalGame.townFed < 10 || finalGame.marketTrust < 25) {
    throw new Error(
      `Reasonable 21-day strategy ended with weak public-demo stats: Food Security ${finalGame.foodSecurity}, Town Fed ${finalGame.townFed}, Market Trust ${finalGame.marketTrust}`
    );
  }
  if (consoleErrors.length > 0) {
    throw new Error(`Console errors:\n${consoleErrors.join("\n")}`);
  }

  console.log("Full 21-day public-demo balance probe passed.");
} finally {
  if (browser) {
    await browser.close();
  }
  stopServer(server.child);
}

async function readGame(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), SAVE_KEY);
}

async function clickAndWait(locator) {
  await locator.click();
  await locator.page().waitForTimeout(35);
}

async function fillReadyRequest(page) {
  const ready = page.locator("[data-request]:not([disabled])").first();
  if ((await ready.count()) < 1) return false;
  await clickAndWait(ready);
  return true;
}

async function harvestReadyCrop(page) {
  const readyCrop = page.locator("[data-plot].is-ready").first();
  if ((await readyCrop.count()) < 1) return false;
  await clickAndWait(readyCrop);
  return true;
}

async function buildUsefulEngine(page) {
  const game = await readGame(page);
  if (game.day < 6) return false;
  if (game.actionsLeft <= 2 && game.day < 17) return false;

  for (const engineId of enginePlan) {
    if (game.engines.includes(engineId)) continue;
    const engine = page.locator(`[data-engine="${engineId}"]:not([disabled])`).first();
    if ((await engine.count()) < 1) continue;

    const before = await readGame(page);
    await clickAndWait(engine);
    const after = await readGame(page);
    if (after.engines.includes(engineId) && after.actionsLeft < before.actionsLeft) {
      return true;
    }
  }
  return false;
}

async function preserveIfUseful(page) {
  const game = await readGame(page);
  const lateRun = game.day >= 12;
  const pantryLow = game.pantryFood < 28;
  const urgentFreshRequest = game.requests.some(
    (request) =>
      request.dueDay - game.day <= 2 &&
      request.needs.some((need) => need.type === "freshFood" && game.freshFood < need.amount)
  );
  if (urgentFreshRequest && !lateRun) return false;
  if (game.freshFood < 14 || (!lateRun && !pantryLow)) return false;

  const before = game.actionsLeft;
  await clickAndWait(page.locator('[data-action="preserve"]'));
  const after = await readGame(page);
  return after.actionsLeft < before;
}

async function sellIfUseful(page) {
  const game = await readGame(page);
  if (game.freshFood < 20 || game.money >= 22) return false;

  const before = game.actionsLeft;
  await clickAndWait(page.locator('[data-action="sell"]'));
  const after = await readGame(page);
  return after.actionsLeft < before;
}

async function waterCrop(page) {
  const needsWater = page.locator("[data-plot].has-crop:not(.is-ready):not(.is-watered):not(.is-spoiled)").first();
  if ((await needsWater.count()) < 1) return false;
  const before = await readGame(page);
  await clickAndWait(needsWater);
  const after = await readGame(page);
  return after.actionsLeft < before.actionsLeft;
}

async function plantUsefulCrop(page) {
  const empty = page.locator("[data-plot].is-empty").first();
  if ((await empty.count()) < 1) return false;

  const crop = chooseCrop(await readGame(page));
  await clickAndWait(page.locator(`[data-crop="${crop}"]`));

  const before = await readGame(page);
  await clickAndWait(empty);
  const after = await readGame(page);
  return after.actionsLeft < before.actionsLeft;
}

function chooseCrop(game) {
  const cropNeed = mostUrgentCropNeed(game);
  if (cropNeed && canPlantCrop(game, cropNeed)) return cropNeed;

  const requestNeed = game.requests
    .slice()
    .sort((a, b) => a.dueDay - b.dueDay)
    .flatMap((request) => request.needs)
    .find((need) => need.type !== "crop");
  if (requestNeed?.type === "freshFood") return affordableCrop(game, game.day % 3 === 0 ? "corn" : "tomatoes");
  if (requestNeed?.type === "pantryFood") return affordableCrop(game, game.day % 2 === 0 ? "potatoes" : "pumpkins");

  if (game.day >= 13 && game.pantryFood < 24) return affordableCrop(game, game.day % 2 === 0 ? "potatoes" : "pumpkins");
  if (game.marketTrust < 38 && game.day > 7) return affordableCrop(game, "apples");
  return affordableCrop(game, cropPlan[(game.day + game.completedRequests + game.missedRequests) % cropPlan.length]);
}

function mostUrgentCropNeed(game) {
  const projected = { ...game.inventory };
  for (const plot of game.plots) {
    if (plot.cropId && !plot.spoiled) {
      projected[plot.cropId] = (projected[plot.cropId] ?? 0) + cropYield[plot.cropId];
    }
  }

  let best = null;
  for (const request of game.requests.slice().sort((a, b) => a.dueDay - b.dueDay)) {
    for (const need of request.needs) {
      if (need.type !== "crop") continue;
      const shortfall = need.amount - (projected[need.cropId] ?? 0);
      if (shortfall <= 0) continue;
      const urgency = Math.max(1, request.dueDay - game.day + 1);
      const score = shortfall * 10 - urgency;
      if (!best || score > best.score) {
        best = { cropId: need.cropId, score };
      }
    }
  }
  return best?.cropId ?? null;
}

function affordableCrop(game, preferred) {
  if (canPlantCrop(game, preferred)) return preferred;
  return ["tomatoes", "wheat", "beans", "potatoes", "lettuce"].find((crop) => canPlantCrop(game, crop)) ?? preferred;
}

function canPlantCrop(game, cropId) {
  const cost = cropCost[cropId];
  return cost && game.money >= cost.money && game.seeds >= cost.seeds;
}

function summarizeGame(game) {
  return {
    day: game.day,
    actionsLeft: game.actionsLeft,
    title: game.ending?.title ?? null,
    score: game.ending?.score ?? null,
    townFed: game.townFed,
    foodSecurity: game.foodSecurity,
    pantryFood: game.pantryFood,
    freshFood: game.freshFood,
    money: game.money,
    water: game.water,
    seeds: game.seeds,
    marketTrust: game.marketTrust,
    completedRequests: game.completedRequests,
    missedRequests: game.missedRequests,
    engines: game.engines.length,
    synergies: game.synergies.length,
    requests: game.requests.map((request) => `${request.templateId}@${request.dueDay}`)
  };
}

async function endDay(page) {
  await clickAndWait(page.locator('[data-action="end-day"]'));
}
