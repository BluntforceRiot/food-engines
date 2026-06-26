import "./styles.css";
import {
  BEST_KEY,
  BULLETIN_START,
  CROPS,
  DAILY_ACTIONS,
  ENGINES,
  EXTRA_BULLETINS,
  GRID_COLUMNS,
  GRID_ROWS,
  REQUEST_TEMPLATES,
  RUN_DAYS,
  SAVE_KEY,
  SYNERGIES,
  type CropId,
  type EngineId,
  type RequestTemplate,
  type ResourceNeed,
  type Reward,
  type WeatherId,
  cropById,
  deterministicWeather,
  engineById,
  weatherById
} from "./game/data";

type ViewName = "title" | "game" | "ending";
type ActionMode = "plant" | "water" | "harvest";

type Plot = {
  id: number;
  cropId: CropId | null;
  age: number;
  watered: boolean;
  spoiled: boolean;
};

type TownRequest = {
  id: string;
  templateId: string;
  title: string;
  body: string;
  dueDay: number;
  needs: ResourceNeed[];
  rewards: Reward;
  success: string;
  failure: string;
};

type Checklist = {
  planted: boolean;
  watered: boolean;
  harvested: boolean;
  request: boolean;
  engine: boolean;
  preserved: boolean;
  pantry: boolean;
};

type Ending = {
  score: number;
  title: string;
  headline: string;
  award: string;
  bestEngine: string;
  worstProblem: string;
  recap: string;
};

type GameState = {
  day: number;
  actionsLeft: number;
  weatherId: WeatherId;
  money: number;
  water: number;
  seeds: number;
  freshFood: number;
  pantryFood: number;
  foodSecurity: number;
  townFed: number;
  marketTrust: number;
  soilHealth: number;
  spoilage: number;
  farmJoy: number;
  weatherStress: number;
  demandPressure: number;
  countyFairPride: number;
  dinerSupply: number;
  schoolLunchReadiness: number;
  emergencyPantryConfidence: number;
  inventory: Record<CropId, number>;
  harvestedCrops: CropId[];
  plots: Plot[];
  engines: EngineId[];
  synergies: string[];
  requests: TownRequest[];
  completedRequests: number;
  missedRequests: number;
  bulletin: string[];
  selectedCrop: CropId;
  mode: ActionMode;
  checklist: Checklist;
  clipboardDismissed: boolean;
  showHow: boolean;
  scoreBonus: number;
  irrigationToggle: boolean;
  ending: Ending | null;
};

const app = getAppRoot();

let state: GameState | null = loadRun();
let view: ViewName = state?.ending ? "ending" : "title";
let toastTimer: number | undefined;
let titleHowOpen = false;

// Public-demo tuning: keeps the 21-day request cadence demanding without turning
// every competent run into a missed-demand pileup.
const REQUEST_DEADLINE_GRACE_DAYS = 2;

const cropOrder = CROPS.map((crop) => crop.id);

function blankInventory(): Record<CropId, number> {
  return CROPS.reduce<Record<CropId, number>>((inventory, crop) => {
    inventory[crop.id] = 0;
    return inventory;
  }, {} as Record<CropId, number>);
}

function createPlots(): Plot[] {
  return Array.from({ length: GRID_COLUMNS * GRID_ROWS }, (_, id) => ({
    id,
    cropId: null,
    age: 0,
    watered: false,
    spoiled: false
  }));
}

function createRequest(template: RequestTemplate, day: number, slot: number): TownRequest {
  return {
    id: `${template.id}-${day}-${slot}`,
    templateId: template.id,
    title: template.title,
    body: template.body,
    dueDay: Math.min(RUN_DAYS, day + template.duration + REQUEST_DEADLINE_GRACE_DAYS),
    needs: template.needs.map((need) => ({ ...need })),
    rewards: { ...template.rewards },
    success: template.success,
    failure: template.failure
  };
}

function createInitialRequests(day: number): TownRequest[] {
  return [0, 3, 6].map((templateIndex, slot) =>
    createRequest(REQUEST_TEMPLATES[templateIndex], day, slot)
  );
}

function newGameState(): GameState {
  return {
    day: 1,
    actionsLeft: DAILY_ACTIONS,
    weatherId: deterministicWeather(1),
    money: 52,
    water: 14,
    seeds: 18,
    freshFood: 0,
    pantryFood: 4,
    foodSecurity: 42,
    townFed: 0,
    marketTrust: 30,
    soilHealth: 72,
    spoilage: 0,
    farmJoy: 10,
    weatherStress: 0,
    demandPressure: 8,
    countyFairPride: 0,
    dinerSupply: 0,
    schoolLunchReadiness: 0,
    emergencyPantryConfidence: 8,
    inventory: blankInventory(),
    harvestedCrops: [],
    plots: createPlots(),
    engines: [],
    synergies: [],
    requests: createInitialRequests(1),
    completedRequests: 0,
    missedRequests: 0,
    bulletin: [...BULLETIN_START],
    selectedCrop: "tomatoes",
    mode: "plant",
    checklist: {
      planted: false,
      watered: false,
      harvested: false,
      request: false,
      engine: false,
      preserved: false,
      pantry: false
    },
    clipboardDismissed: false,
    showHow: false,
    scoreBonus: 0,
    irrigationToggle: false,
    ending: null
  };
}

function startNewGame(force = false): void {
  if (!force && hasSavedRun() && !window.confirm("Start a new farm and overwrite the saved run?")) {
    return;
  }

  state = newGameState();
  view = "game";
  saveRun();
  render();
  showToast("Farm opened. Tomatoes are now infrastructure-adjacent.");
}

function continueGame(): void {
  const loaded = loadRun();
  if (!loaded) {
    showToast("No saved run found.");
    return;
  }

  state = loaded;
  view = loaded.ending ? "ending" : "game";
  render();
}

function hasSavedRun(): boolean {
  return Boolean(localStorage.getItem(SAVE_KEY));
}

function loadRun(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as GameState;
    if (!Array.isArray(parsed.plots) || !parsed.inventory || !parsed.day) {
      return null;
    }
    return {
      ...newGameState(),
      ...parsed,
      inventory: { ...blankInventory(), ...parsed.inventory },
      ending: parsed.ending ?? null
    };
  } catch {
    return null;
  }
}

function saveRun(): void {
  if (!state) {
    return;
  }

  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    showToast("Save failed. Browser storage may be full.");
  }
}

function clearRun(): void {
  localStorage.removeItem(SAVE_KEY);
}

function getBestScore(): number {
  const value = Number(localStorage.getItem(BEST_KEY) ?? "0");
  return Number.isFinite(value) ? value : 0;
}

function setBestScore(score: number): void {
  const best = Math.max(getBestScore(), score);
  localStorage.setItem(BEST_KEY, String(best));
}

function requireState(): GameState {
  if (!state) {
    state = newGameState();
  }
  return state;
}

function getAppRoot(): HTMLDivElement {
  const root = document.querySelector<HTMLDivElement>("#app");
  if (!root) {
    throw new Error("Missing #app root.");
  }
  return root;
}

function spendAction(label: string): boolean {
  const game = requireState();
  if (game.actionsLeft <= 0) {
    showToast(`No actions left. End the day before trying to ${label}.`);
    return false;
  }
  game.actionsLeft -= 1;
  return true;
}

function addBulletin(line: string): void {
  const game = requireState();
  game.bulletin = [line, ...game.bulletin].slice(0, 9);
}

function applyReward(reward: Reward): void {
  const game = requireState();
  game.money += reward.money ?? 0;
  game.water += reward.water ?? 0;
  game.seeds += reward.seeds ?? 0;
  game.pantryFood += reward.pantryFood ?? 0;
  game.foodSecurity = clamp(game.foodSecurity + (reward.foodSecurity ?? 0), 0, 100);
  game.townFed += reward.townFed ?? 0;
  game.marketTrust = clamp(game.marketTrust + (reward.marketTrust ?? 0), 0, 100);
  game.soilHealth = clamp(game.soilHealth + (reward.soilHealth ?? 0), 0, 100);
  game.countyFairPride += reward.countyFairPride ?? 0;
}

function plantCrop(plotId: number, cropId: CropId): void {
  const game = requireState();
  const plot = game.plots[plotId];
  const crop = cropById(cropId);

  if (!plot || plot.cropId) {
    showToast("Tile already occupied.");
    return;
  }
  if (game.money < crop.cost) {
    showToast("Not enough money.");
    return;
  }
  if (game.seeds < crop.seedCost) {
    showToast("Not enough seeds.");
    return;
  }
  if (!spendAction(`plant ${crop.name}`)) {
    return;
  }

  game.money -= crop.cost;
  game.seeds -= crop.seedCost;
  plot.cropId = crop.id;
  plot.age = 0;
  plot.watered = weatherGivesFreeWater(game.weatherId);
  plot.spoiled = false;
  game.checklist.planted = true;
  addBulletin(`${crop.name} planted. ${crop.tagline}`);
  saveRun();
  render();
  showToast(`${crop.name} planted.`);
}

function waterPlot(plotId: number): void {
  const game = requireState();
  const plot = game.plots[plotId];
  if (!plot?.cropId) {
    showToast("No crop there to water.");
    return;
  }
  if (plot.spoiled) {
    showToast("That crop is already spoiled.");
    return;
  }
  if (plot.watered) {
    showToast("Already watered.");
    return;
  }

  let waterCost = 1;
  if (game.engines.includes("irrigation")) {
    game.irrigationToggle = !game.irrigationToggle;
    waterCost = game.irrigationToggle ? 0 : 1;
  }
  if (game.water < waterCost) {
    showToast("Not enough water.");
    return;
  }
  if (!spendAction("water crops")) {
    return;
  }

  game.water -= waterCost;
  plot.watered = true;
  game.checklist.watered = true;
  addBulletin(waterCost === 0 ? "Irrigation ditch handled that watering with tiny canal smugness." : "Crop watered.");
  saveRun();
  render();
  showToast("Crop watered.");
}

function harvestPlot(plotId: number): void {
  const game = requireState();
  const plot = game.plots[plotId];
  if (!plot?.cropId) {
    showToast("No crop there to harvest.");
    return;
  }
  if (plot.spoiled) {
    clearPlot(plot);
    game.soilHealth = clamp(game.soilHealth - 2, 0, 100);
    addBulletin("Wilted crop cleared. Compost would like a word.");
    saveRun();
    render();
    showToast("Spoiled crop cleared.");
    return;
  }

  const crop = cropById(plot.cropId);
  if (!isReady(plot)) {
    showToast("Crop not ready.");
    return;
  }
  if (!spendAction(`harvest ${crop.name}`)) {
    return;
  }

  const soilBonus = game.soilHealth >= 80 ? 1 : 0;
  const weatherBonus = game.weatherId === "perfect" ? 1 : 0;
  const yieldAmount = crop.yield + soilBonus + weatherBonus;
  game.inventory[crop.id] += yieldAmount;
  game.freshFood += yieldAmount * crop.freshValue;
  game.money += Math.max(0, Math.floor(crop.sellValue / 2));
  if (!game.harvestedCrops.includes(crop.id)) {
    game.harvestedCrops.push(crop.id);
  }
  if (game.engines.includes("seedShed") && (plot.id + game.day + yieldAmount) % 2 === 0) {
    game.seeds += 1;
    addBulletin("Seed Saving Shed returned a seed. Tomatoes stop billing you, slowly.");
  }
  if (game.engines.includes("rotation") && new Set(game.harvestedCrops).size >= 4) {
    game.soilHealth = clamp(game.soilHealth + 1, 0, 100);
    game.foodSecurity = clamp(game.foodSecurity + 1, 0, 100);
  }
  game.checklist.harvested = true;
  clearPlot(plot);
  addBulletin(`Harvested ${crop.name}. +${yieldAmount} crop, +${yieldAmount * crop.freshValue} fresh food.`);
  checkSynergies();
  saveRun();
  render();
  showToast(`Harvested ${crop.name}.`);
}

function clearPlot(plot: Plot): void {
  plot.cropId = null;
  plot.age = 0;
  plot.watered = false;
  plot.spoiled = false;
}

function buildEngine(engineId: EngineId): void {
  const game = requireState();
  const engine = engineById(engineId);
  if (game.engines.includes(engineId)) {
    showToast("Engine already built.");
    return;
  }
  if (game.money < engine.cost) {
    showToast("Not enough money.");
    return;
  }
  if (!spendAction(`build ${engine.name}`)) {
    return;
  }

  game.money -= engine.cost;
  game.engines.push(engineId);
  game.checklist.engine = true;
  addBulletin(`${engine.name} built. ${engine.flavor}`);
  checkSynergies();
  saveRun();
  render();
  showToast(`${engine.name} built.`);
}

function preserveFood(): void {
  const game = requireState();
  if (game.freshFood < 8) {
    showToast("Not enough fresh food to preserve.");
    return;
  }
  if (!spendAction("preserve food")) {
    return;
  }

  let convert = Math.min(game.freshFood, 14);
  let pantryGain = Math.floor(convert * 0.65);
  if (game.engines.includes("cannery")) {
    convert = Math.min(game.freshFood, 20);
    pantryGain = Math.floor(convert * 0.95);
  }
  if (game.engines.includes("rootCellar")) {
    pantryGain += 3;
  }
  if (game.engines.includes("soupPot")) {
    game.townFed += 3;
  }

  game.freshFood -= convert;
  game.pantryFood += pantryGain;
  game.emergencyPantryConfidence += Math.floor(pantryGain / 3);
  game.foodSecurity = clamp(game.foodSecurity + 3, 0, 100);
  game.checklist.preserved = true;
  if (game.pantryFood >= 20) {
    game.checklist.pantry = true;
  }
  addBulletin(
    game.engines.includes("cannery")
      ? "Cannery turned panic into jars."
      : "Pantry stocked from the kitchen table. Respectable, if a little frantic."
  );
  checkSynergies();
  saveRun();
  render();
  showToast(`Pantry stocked: +${pantryGain}.`);
}

function sellSurplus(): void {
  const game = requireState();
  if (game.freshFood < 10) {
    showToast("Not enough fresh food to sell.");
    return;
  }
  if (!spendAction("sell surplus")) {
    return;
  }

  const amount = Math.min(game.freshFood, 18);
  const multiplier = game.engines.includes("farmStand") ? 1.15 : 0.75;
  const marketBoost = game.engines.includes("marketStall") ? 6 : 0;
  const earned = Math.floor(amount * multiplier) + marketBoost;
  game.freshFood -= amount;
  game.money += earned;
  game.marketTrust = clamp(game.marketTrust + (game.engines.includes("csaBoard") ? 3 : 1), 0, 100);
  if (game.engines.includes("marketStall")) {
    game.demandPressure += 2;
  }
  addBulletin("Farm stand sells out. Honor-system capitalism reports tomato momentum.");
  checkSynergies();
  saveRun();
  render();
  showToast(`Sold surplus for $${earned}.`);
}

function completeRequest(requestId: string): void {
  const game = requireState();
  const request = game.requests.find((item) => item.id === requestId);
  if (!request) {
    showToast("Request not found.");
    return;
  }
  if (!canPayNeeds(request.needs)) {
    showToast("Not enough food for that request.");
    return;
  }
  if (!spendAction("fill request")) {
    return;
  }

  payNeeds(request.needs);
  const reward = { ...request.rewards };
  if (game.engines.includes("communityKitchen")) {
    reward.townFed = (reward.townFed ?? 0) + 3;
  }
  if (game.engines.includes("csaBoard")) {
    reward.marketTrust = (reward.marketTrust ?? 0) + 2;
  }
  if (game.engines.includes("bakery") && request.templateId.includes("pie")) {
    reward.countyFairPride = (reward.countyFairPride ?? 0) + 4;
  }
  applyReward(reward);
  game.completedRequests += 1;
  game.schoolLunchReadiness += request.templateId.includes("school") ? 8 : 1;
  game.dinerSupply += request.templateId.includes("diner") ? 8 : 1;
  game.demandPressure = Math.max(0, game.demandPressure - 2);
  game.requests = game.requests.filter((item) => item.id !== requestId);
  game.checklist.request = true;
  addBulletin(request.success);
  addRequestsUntil(3);
  checkSynergies();
  saveRun();
  render();
  showToast("Town fed.");
}

function canPayNeeds(needs: ResourceNeed[]): boolean {
  const game = requireState();
  return needs.every((need) => {
    if (need.type === "crop") {
      return game.inventory[need.cropId] >= need.amount;
    }
    if (need.type === "freshFood") {
      return game.freshFood >= need.amount;
    }
    return game.pantryFood >= need.amount;
  });
}

function payNeeds(needs: ResourceNeed[]): void {
  const game = requireState();
  for (const need of needs) {
    if (need.type === "crop") {
      game.inventory[need.cropId] -= need.amount;
    } else if (need.type === "freshFood") {
      game.freshFood -= need.amount;
    } else {
      game.pantryFood -= need.amount;
    }
  }
}

function addRequestsUntil(targetCount: number): void {
  const game = requireState();
  while (game.requests.length < targetCount) {
    const index = (game.day + game.completedRequests + game.missedRequests + game.requests.length) % REQUEST_TEMPLATES.length;
    game.requests.push(createRequest(REQUEST_TEMPLATES[index], game.day, game.requests.length));
  }
}

function checkSynergies(): void {
  const game = requireState();
  for (const synergy of SYNERGIES) {
    if (game.synergies.includes(synergy.id)) {
      continue;
    }

    const enginesOk = synergy.requirements.engines?.every((engine) => game.engines.includes(engine)) ?? true;
    const cropsOk =
      synergy.requirements.cropsHarvested?.every((crop) => game.harvestedCrops.includes(crop)) ?? true;
    if (!enginesOk || !cropsOk) {
      continue;
    }

    game.synergies.push(synergy.id);
    applyReward(synergy.reward);
    game.scoreBonus += synergy.reward.score ?? 0;
    addBulletin(synergy.bulletin);
    showToast(`Synergy unlocked: ${synergy.name}.`);
  }
}

function endDay(): void {
  const game = requireState();
  resolveMissedRequests();
  resolveGrowthAndWeather();
  resolveSpoilage();

  if (game.day >= RUN_DAYS) {
    finishRun();
    return;
  }

  game.day += 1;
  game.actionsLeft = DAILY_ACTIONS;
  game.weatherId = deterministicWeather(game.day);
  if (game.engines.includes("well")) {
    game.water += 3;
    addBulletin("Well provides daily water. Hole in ground. Civilization follows.");
  }
  if (game.weatherId === "fair") {
    game.marketTrust = clamp(game.marketTrust + 2, 0, 100);
    game.countyFairPride += 3;
  }
  addRequestsUntil(3);
  addBulletin(weatherById(game.weatherId).flavor);
  saveRun();
  render();
  showToast(`Day ${game.day}: ${weatherById(game.weatherId).name}.`);
}

function resolveMissedRequests(): void {
  const game = requireState();
  const remaining: TownRequest[] = [];
  for (const request of game.requests) {
    if (request.dueDay <= game.day && !canPayNeeds(request.needs)) {
      game.missedRequests += 1;
      game.foodSecurity = clamp(game.foodSecurity - 4, 0, 100);
      game.marketTrust = clamp(game.marketTrust - 3, 0, 100);
      game.demandPressure += 4;
      addBulletin(request.failure);
    } else {
      remaining.push(request);
    }
  }
  game.requests = remaining;
}

function resolveGrowthAndWeather(): void {
  const game = requireState();
  const weather = game.weatherId;
  const freeWater = weatherGivesFreeWater(weather);
  if (freeWater) {
    for (const plot of game.plots) {
      if (plot.cropId && !plot.spoiled) {
        plot.watered = true;
      }
    }
    if (game.engines.includes("rainBarrel")) {
      const refill = weather === "storm" ? 8 : 5;
      game.water += refill;
      addBulletin(`Rain barrel filled: +${refill} water.`);
    }
  }

  if (weather === "dryWind") {
    game.water = Math.max(0, game.water - 3);
    game.soilHealth = clamp(game.soilHealth - 2, 0, 100);
    game.weatherStress += 2;
  }
  if (weather === "heat") {
    game.water = Math.max(0, game.water - 2);
    game.weatherStress += 3;
  }
  if (weather === "storm") {
    game.water += 4;
    game.weatherStress += 1;
  }
  if (weather === "perfect") {
    game.farmJoy += 4;
    game.soilHealth = clamp(game.soilHealth + 1, 0, 100);
  }

  for (const plot of game.plots) {
    if (!plot.cropId || plot.spoiled) {
      continue;
    }
    const crop = cropById(plot.cropId);
    const protectedByGreenhouse = game.engines.includes("greenhouse") && plot.id % 5 === 0;
    const wateredEnough = plot.watered || freeWater;
    if (wateredEnough || protectedByGreenhouse) {
      plot.age += weather === "perfect" ? 2 : 1;
      if (weather === "cool" && !protectedByGreenhouse) {
        plot.age = Math.max(0, plot.age - 1);
      }
    } else if (weather === "heat" || weather === "dryWind") {
      game.soilHealth = clamp(game.soilHealth - 1, 0, 100);
      if (crop.id === "lettuce" || plot.age > 1) {
        plot.spoiled = true;
        game.spoilage += 2;
        addBulletin(`${crop.name} wilted. Weather had opinions.`);
      }
    }

    if (weather === "storm" && !protectedByGreenhouse && (plot.id + game.day) % 13 === 0) {
      plot.spoiled = true;
      game.spoilage += 2;
      addBulletin(`${crop.name} took storm damage.`);
    }
    plot.watered = false;
  }
}

function resolveSpoilage(): void {
  const game = requireState();
  const cropSpoilPressure = CROPS.reduce((sum, crop) => sum + game.inventory[crop.id] * crop.spoilageRate, 0);
  let freshSpoilage = Math.floor(game.freshFood * 0.07 + cropSpoilPressure * 0.16);
  if (game.weatherId === "heat") {
    freshSpoilage += 4;
  }
  if (game.weatherId === "cool") {
    freshSpoilage = Math.floor(freshSpoilage * 0.55);
  }
  if (game.engines.includes("rootCellar")) {
    freshSpoilage = Math.floor(freshSpoilage * 0.55);
  }
  if (freshSpoilage > 0) {
    game.freshFood = Math.max(0, game.freshFood - freshSpoilage);
    game.spoilage += freshSpoilage;
    addBulletin(`Spoilage cost ${freshSpoilage} fresh food.`);
    if (game.engines.includes("compost")) {
      const compostGain = Math.min(5, Math.ceil(freshSpoilage / 3));
      game.soilHealth = clamp(game.soilHealth + compostGain, 0, 100);
      addBulletin(`Compost Bin turned scraps into +${compostGain} soil health.`);
    }
  }

  if (game.pantryFood >= 25) {
    game.emergencyPantryConfidence += 1;
    game.foodSecurity = clamp(game.foodSecurity + 1, 0, 100);
  }
  if (game.freshFood + game.pantryFood < game.demandPressure) {
    game.foodSecurity = clamp(game.foodSecurity - 2, 0, 100);
  }
}

function weatherGivesFreeWater(weather: WeatherId): boolean {
  return weather === "rain" || weather === "storm" || weather === "perfect";
}

function isReady(plot: Plot): boolean {
  if (!plot.cropId || plot.spoiled) {
    return false;
  }
  return plot.age >= cropById(plot.cropId).growthDays;
}

function finishRun(): void {
  const game = requireState();
  const ending = buildEnding(game);
  game.ending = ending;
  setBestScore(ending.score);
  saveRun();
  view = "ending";
  render();
  showToast("Final ledger printed.");
}

function buildEnding(game: GameState): Ending {
  const score =
    game.townFed * 8 +
    game.foodSecurity * 10 +
    game.pantryFood * 5 +
    game.soilHealth * 4 +
    game.marketTrust * 6 +
    game.money * 2 +
    game.synergies.length * 80 +
    game.countyFairPride * 7 +
    game.scoreBonus -
    game.spoilage * 4 -
    game.weatherStress * 20 -
    game.missedRequests * 55;
  const cleanScore = Math.max(0, Math.round(score));
  const title = endingTitle(game, cleanScore);
  const headline = endingHeadline(game, title);
  const award = endingAward(game);
  const bestEngine = bestEngineName(game);
  const worstProblem = worstProblemName(game);
  const recap = `I built ${title} in Food Engines. Score: ${cleanScore}. Town Fed: ${game.townFed}. Pantry: ${game.pantryFood}. Soil: ${game.soilHealth}. Best engine: ${bestEngine}. Worst problem: ${worstProblem}.`;
  return {
    score: cleanScore,
    title,
    headline,
    award,
    bestEngine,
    worstProblem,
    recap
  };
}

function endingTitle(game: GameState, score: number): string {
  if (score <= 100 || (game.foodSecurity < 20 && game.townFed <= 2)) return "Grocery Truck Dependency";
  if (
    game.missedRequests >= 10 ||
    (game.missedRequests >= 8 && (game.marketTrust < 20 || game.foodSecurity < 45)) ||
    (game.marketTrust < 15 && game.demandPressure >= 28)
  ) {
    return "Missed Demand Spiral";
  }
  if (game.pantryFood < 12 && game.foodSecurity < 35) return "Pantry Failed To Launch";
  if (
    (game.weatherStress >= 20 && (score < 900 || game.foodSecurity < 45 || game.pantryFood < 18)) ||
    (game.weatherStress >= 14 && game.spoilage >= 18 && score < 1200)
  ) {
    return "Weather Ate The Farm";
  }
  if (score < 650 && game.harvestedCrops.includes("tomatoes") && (game.townFed <= 4 || game.foodSecurity < 40)) {
    return "Tomato Symbolism Could Not Feed The Town";
  }
  if (game.foodSecurity < 45 || game.marketTrust < 25) return "Grocery Truck Dependency";
  if (game.foodSecurity >= 88 && game.pantryFood >= 45 && game.townFed >= 30 && score >= 1700) return "Pantry Republic";
  if (game.synergies.includes("soup-republic") && game.townFed >= 20) return "Soup-Based Civilization";
  if (game.synergies.includes("bread-independence") && game.marketTrust >= 45) return "Breadbasket Boom";
  if (game.weatherStress > 20 && game.harvestedCrops.includes("lettuce")) return "Lettuce Collapse";
  if (game.inventory.tomatoes > 25 && game.foodSecurity >= 55 && game.townFed >= 12) return "Tomato Sovereignty";
  if (game.inventory.potatoes > 25 && game.pantryFood >= 25) return "Potato Emergency State";
  if (game.marketTrust >= 75 && game.completedRequests >= 4) return "Market Garden Hero";
  if (game.engines.includes("compost") && game.soilHealth >= 90 && score >= 900) return "Compost Alchemist Victory";
  if (game.pantryFood >= 35 && game.foodSecurity >= 60) return "Winter Confidence Achieved";
  if (game.countyFairPride >= 30 && game.marketTrust >= 50) return "County Fair Food Hero";
  if (score > 1800 && game.townFed >= 20) return "Diner Supply Miracle";
  return "Root Cellar Republic";
}

function endingHeadline(game: GameState, title: string): string {
  if (title === "Grocery Truck Dependency") return "Town Rechecks Grocery Schedule After Farm Comes Up Short";
  if (title === "Pantry Failed To Launch") return "Pantry Shelves Request More Than Symbolic Vegetables";
  if (title === "Missed Demand Spiral") return "Town Board Finds Demand Outran The Produce Wagon";
  if (title === "Weather Ate The Farm") return "Weather Takes Credit For Several Bad Agricultural Decisions";
  if (title === "Tomato Symbolism Could Not Feed The Town") return "Tomato Symbolism Could Not Feed The Town";
  if (title.includes("Pantry")) return "Food Pantry Enters Winter With Dangerous Levels Of Confidence";
  if (game.synergies.includes("soup-republic")) return "Soup Republic Forms After Successful Community Kitchen Run";
  if (game.synergies.includes("winter-confidence")) return "Root Cellar Declared Strategic Asset";
  if (title === "Tomato Sovereignty") return "Tiny Farm Keeps Town Fed, Mostly Through Tomatoes And Stubbornness";
  if (game.spoilage > 30) return "Lettuce Failure Raises Questions About Moisture Policy";
  if (game.countyFairPride > 20) return "County Fair Pie Table Stabilizes Local Morale";
  if (game.engines.includes("cannery")) return "Canning Jars Credited With Preventing Civic Nonsense";
  return "School Lunch Saved By Aggressive Wheat Policy";
}

function endingAward(game: GameState): string {
  if (game.foodSecurity < 25 || game.townFed <= 2) return "Emergency Grocery Receipt";
  if (game.missedRequests >= 8) return "Demand Board Caution Ribbon";
  if (game.pantryFood < 12 && game.foodSecurity < 40) return "Pantry Wake-Up Call";
  if (game.weatherStress >= 18) return "Weather Stress Survivor";
  if (game.harvestedCrops.includes("tomatoes") && game.townFed < 8) return "Symbolic Tomato Citation";
  if (game.harvestedCrops.includes("tomatoes")) return "Tomato Infrastructure Medal";
  if (game.engines.includes("rootCellar")) return "Root Cellar Night Shift";
  if (game.countyFairPride > 20) return "Blue Ribbon Logistics";
  if (game.dinerSupply > 8) return "Diner Supply Hero";
  if (game.schoolLunchReadiness > 8) return "School Lunch Defender";
  if (game.completedRequests >= 5) return "Firehouse Chili Champion";
  if (game.engines.includes("rainBarrel")) return "Rain Barrel Diplomat";
  if (game.engines.includes("compost")) return "Compost Alchemist";
  return "Pantry Panic Survivor";
}

function bestEngineName(game: GameState): string {
  if (game.engines.length === 0) return "none";
  const priority: EngineId[] = ["cannery", "rootCellar", "communityKitchen", "well", "rainBarrel", "bakery"];
  const best = priority.find((engine) => game.engines.includes(engine)) ?? game.engines[0];
  return engineById(best).name;
}

function worstProblemName(game: GameState): string {
  const problems = [
    { name: "missed demand", value: game.missedRequests * 10 },
    { name: "spoilage", value: game.spoilage },
    { name: "weather stress", value: game.weatherStress * 6 },
    { name: "thin pantry", value: Math.max(0, 35 - game.pantryFood) }
  ];
  return problems.sort((a, b) => b.value - a.value)[0].name;
}

function setMode(mode: ActionMode): void {
  const game = requireState();
  game.mode = mode;
  saveRun();
  render();
}

function setCrop(cropId: CropId): void {
  const game = requireState();
  game.selectedCrop = cropId;
  game.mode = "plant";
  saveRun();
  render();
}

function dismissClipboard(): void {
  const game = requireState();
  game.clipboardDismissed = true;
  saveRun();
  render();
}

function toggleHow(): void {
  if (view === "title") {
    titleHowOpen = !titleHowOpen;
  } else if (state) {
    state.showHow = !state.showHow;
  }
  render();
}

function onPlotClick(plotId: number): void {
  const game = requireState();
  const plot = game.plots[plotId];
  if (!plot) {
    return;
  }
  if (game.mode === "water") {
    waterPlot(plotId);
    return;
  }
  if (game.mode === "harvest") {
    harvestPlot(plotId);
    return;
  }
  if (plot.cropId) {
    if (isReady(plot) || plot.spoiled) {
      harvestPlot(plotId);
      return;
    }
    if (!plot.watered) {
      waterPlot(plotId);
      return;
    }
    showToast("Crop is growing.");
    return;
  }
  plantCrop(plotId, game.selectedCrop);
}

function copyRecap(): void {
  const game = requireState();
  if (!game.ending) {
    return;
  }
  navigator.clipboard
    ?.writeText(game.ending.recap)
    .then(() => showToast("Recap copied."))
    .catch(() => {
      const box = document.querySelector<HTMLTextAreaElement>("#recapFallback");
      if (box) {
        box.hidden = false;
        box.focus();
        box.select();
      }
      showToast("Clipboard blocked. Recap opened for selection.");
    });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function showToast(message: string): void {
  const toast = document.querySelector<HTMLDivElement>(".toast");
  if (!toast) {
    return;
  }
  toast.textContent = message;
  toast.classList.add("toast--show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("toast--show"), 2200);
}

function render(): void {
  if (view === "title") {
    renderTitle();
  } else if (view === "ending") {
    renderEnding();
  } else {
    renderGame();
  }
}

function renderTitle(): void {
  app.innerHTML = `
    <main class="title-screen" data-screen="title">
      <section class="hero-card">
        <div class="hero-copy">
          <p class="eyebrow">Summer into AI Week 2: Independence Engines</p>
          <h1>Food Engines</h1>
          <p class="subtitle">Plant the food. Feed the town. Discover that tomatoes are infrastructure.</p>
          <p class="pitch">Build the tiny food system underneath a fed town: soil, water, seeds, kitchens, preservation, markets, weather, and community trust.</p>
          <div class="title-actions">
            <button class="button button--primary" data-action="start">Start Farm</button>
            <button class="button" data-action="how">How Food Engines Work</button>
      ${hasSavedRun() ? `<button class="button" data-action="continue">Load Saved Run</button>` : ""}
          </div>
          <p class="footer-line">A tiny American farm sim about turning dirt, water, and panic into dinner.</p>
        </div>
        <div class="hero-farm" aria-hidden="true">
          <div class="hero-sky"></div>
          <div class="hero-barn"><span></span></div>
          <div class="hero-silo"></div>
          <div class="hero-tower">WATER</div>
          <div class="hero-grid">
            ${Array.from({ length: 24 }, (_, index) => `<span class="hero-crop hero-crop-${index % 5}"></span>`).join("")}
          </div>
          <div class="hero-road"></div>
        </div>
      </section>
      <section class="how-panel ${titleHowOpen ? "is-open" : ""}" aria-live="polite">
        <h2>How Food Engines Work</h2>
        <ol>
          <li>Plant crops on the farm grid.</li>
          <li>Water them when a plot says WATER. Water is limited.</li>
          <li>Complete town requests for trust and food security.</li>
          <li>Build food engines: soil, water, seeds, kitchens, preservation, markets.</li>
          <li>Store pantry food before weather and demand get rude.</li>
          <li>Each day has 6 actions. Finish 21 days with a town that can feed itself.</li>
        </ol>
      </section>
      <div class="toast" role="status"></div>
    </main>
  `;
  bindEvents();
}

function renderGame(): void {
  const game = requireState();
  const weather = weatherById(game.weatherId);
  app.innerHTML = `
    <main class="game-shell" data-screen="game">
      <header class="hud">
        ${statPill("Day", `${game.day} of ${RUN_DAYS}`)}
        ${statPill("Actions Left", `${game.actionsLeft}/${DAILY_ACTIONS}`)}
        ${statPill("Weather", weather.name)}
        ${statPill("Money", `$${game.money}`)}
        ${statPill("Water Left", String(game.water))}
        ${statPill("Seeds", String(game.seeds))}
        ${statPill("Fresh", String(game.freshFood))}
        ${statPill("Pantry", String(game.pantryFood))}
        ${meterPill("Food Security", game.foodSecurity)}
      </header>

      <section class="main-layout">
        <aside class="panel action-panel">
          <div class="panel-heading">
            <span>Farm Tools</span>
            <button class="text-button" data-action="how">?</button>
          </div>
          <div class="mode-row" role="group" aria-label="Farm actions">
            ${modeButton("plant", "Plant")}
            ${modeButton("water", "Water")}
            ${modeButton("harvest", "Harvest")}
          </div>
          <h2>Crops</h2>
          <div class="crop-list">
            ${CROPS.map((crop) => cropButton(crop.id)).join("")}
          </div>
          <h2>Engines</h2>
          <div class="engine-list">
            ${ENGINES.map((engine) => engineButton(engine.id)).join("")}
          </div>
        </aside>

        <section class="farm-stage">
          <div class="weather-strip">
            <strong>${weather.name}</strong>
            <span>${weather.effect}</span>
          </div>
          <div class="farm-map">
            <div class="farm-decoration barn-art" aria-label="Red barn">BARN</div>
            <div class="farm-decoration silo-art" aria-label="Grain silo">SILO</div>
            <div class="farm-decoration tower-art" aria-label="Water tower">WATER</div>
            <div class="farm-decoration stand-art" aria-label="Farm stand">FARM STAND</div>
            <div class="farm-decoration fence-art" aria-hidden="true"></div>
            <div class="farm-grid" aria-label="Farm grid">
              ${game.plots.map((plot) => plotButton(plot)).join("")}
            </div>
            <div class="county-road">COUNTY ROAD</div>
          </div>
          ${clipboardPanel(game)}
        </section>

        <aside class="panel town-panel">
          <div class="panel-heading">
            <span>Town Request Board</span>
            <span class="badge">${game.completedRequests} filled</span>
          </div>
          <div class="request-list">
            ${game.requests.map(requestCard).join("")}
          </div>
          <div class="quick-actions">
            <button class="button" data-action="preserve">Preserve Food</button>
            <button class="button" data-action="sell">Sell Surplus</button>
            <button class="button button--primary" data-action="end-day">End Day</button>
          </div>
          <section class="score-preview">
            <h2>Score Preview</h2>
            <div>Town Fed: <strong>${game.townFed}</strong></div>
            <div>Market Trust: <strong>${game.marketTrust}</strong></div>
            <div>Soil Health: <strong>${game.soilHealth}</strong></div>
            <div>Synergies: <strong>${game.synergies.length}</strong></div>
          </section>
          <section class="synergy-panel">
            <h2>Engine Synergies</h2>
            ${
              game.synergies.length
                ? game.synergies.map((id) => `<span class="synergy-chip">${SYNERGIES.find((s) => s.id === id)?.name ?? id}</span>`).join("")
                : `<p class="muted">Build matching engines and harvest the right crops.</p>`
            }
          </section>
          <section class="radio">
            <h2>Farm Radio / County Bulletin</h2>
            ${game.bulletin.map((line) => `<p>${line}</p>`).join("")}
          </section>
        </aside>
      </section>

      <section class="how-panel overlay ${game.showHow ? "is-open" : ""}" aria-live="polite">
        <button class="close-button" data-action="how">Close</button>
        <h2>How Food Engines Work</h2>
        <ol>
          <li>Plant crops, then water plots marked WATER unless rain helps.</li>
          <li>You get 6 actions each day. The HUD shows Actions Left and Day 1 of 21.</li>
          <li>Water is a limited resource; wells, rain barrels, and rain help refill it.</li>
          <li>Harvesting costs 1 action and gives crop inventory plus Fresh Food.</li>
          <li>Fill town requests to raise Town Fed, Market Trust, and Food Security.</li>
          <li>Build engines to improve soil, water, seeds, kitchens, preservation, and markets.</li>
          <li>Preserve Fresh Food into Pantry Food before the last week.</li>
          <li>End Day resolves growth, weather, spoilage, demand, and events.</li>
        </ol>
      </section>
      <div class="toast" role="status"></div>
    </main>
  `;
  bindEvents();
}

function renderEnding(): void {
  const game = requireState();
  const ending = game.ending ?? buildEnding(game);
  app.innerHTML = `
    <main class="ending-screen" data-screen="ending">
      <section class="newspaper">
        <p class="eyebrow">The County Food Ledger</p>
        <h1>${ending.headline}</h1>
        <div class="score-stamp">${ending.title}</div>
        <div class="score-number">${ending.score}</div>
        <div class="ending-grid">
          ${endingMetric("Town Fed", game.townFed)}
          ${endingMetric("Food Security", `${game.foodSecurity}/100`)}
          ${endingMetric("Pantry Reserves", game.pantryFood)}
          ${endingMetric("Soil Health", `${game.soilHealth}/100`)}
          ${endingMetric("Market Trust", `${game.marketTrust}/100`)}
          ${endingMetric("Money Remaining", `$${game.money}`)}
          ${endingMetric("Engine Synergies", game.synergies.length)}
          ${endingMetric("County Fair Pride", game.countyFairPride)}
          ${endingMetric("Spoilage Penalty", game.spoilage)}
          ${endingMetric("Weather Stress", game.weatherStress)}
          ${endingMetric("Missed Demand", game.missedRequests)}
          ${endingMetric("Best Score", getBestScore())}
        </div>
        <div class="award-ribbon">${ending.award}</div>
        <p class="recap">${ending.recap}</p>
        <textarea id="recapFallback" class="recap-box" hidden>${ending.recap}</textarea>
        <div class="title-actions">
          <button class="button button--primary" data-action="copy">Copy Recap</button>
          <button class="button" data-action="start">New Run</button>
          <button class="button" data-action="title">Title</button>
        </div>
      </section>
      <div class="toast" role="status"></div>
    </main>
  `;
  bindEvents();
}

function statPill(label: string, value: string): string {
  return `<div class="stat-pill"><span>${label}</span><strong>${value}</strong></div>`;
}

function meterPill(label: string, value: number): string {
  return `
    <div class="stat-pill meter-pill">
      <span>${label}</span>
      <strong>${value}/100</strong>
      <div class="meter"><span style="width:${clamp(value, 0, 100)}%"></span></div>
    </div>
  `;
}

function modeButton(mode: ActionMode, label: string): string {
  const game = requireState();
  return `<button class="mode-button ${game.mode === mode ? "is-active" : ""}" data-mode="${mode}">${label}</button>`;
}

function cropButton(cropId: CropId): string {
  const game = requireState();
  const crop = cropById(cropId);
  const selected = game.selectedCrop === cropId && game.mode === "plant";
  return `
    <button class="crop-button ${selected ? "is-active" : ""}" data-crop="${crop.id}">
      <span class="mini-crop" style="--crop:${crop.color};--accent:${crop.accent}">${crop.short}</span>
      <span><strong>${crop.name}</strong><small>${crop.growthDays}d, $${crop.cost}, ${crop.seedCost} seed</small></span>
    </button>
  `;
}

function engineButton(engineId: EngineId): string {
  const game = requireState();
  const engine = engineById(engineId);
  const built = game.engines.includes(engine.id);
  return `
    <button class="engine-button ${built ? "is-built" : ""}" data-engine="${engine.id}" ${built ? "disabled" : ""}>
      <span>${built ? "Built" : `$${engine.cost}`}</span>
      <strong>${engine.name}</strong>
      <small>${engine.category} - ${engine.effect}</small>
    </button>
  `;
}

function plotButton(plot: Plot): string {
  const crop = plot.cropId ? cropById(plot.cropId) : null;
  const ready = isReady(plot);
  const classes = [
    "plot",
    crop ? "has-crop" : "is-empty",
    crop ? `crop-${crop.id}` : "",
    ready ? "is-ready" : "",
    plot.watered ? "is-watered" : "",
    plot.spoiled ? "is-spoiled" : ""
  ]
    .filter(Boolean)
    .join(" ");
  const stage = plotStage(plot);
  const label = crop
    ? `${crop.name}, ${plot.spoiled ? "spoiled" : ready ? "ready" : `${Math.max(0, crop.growthDays - plot.age)} days left`}`
    : "Empty plot";
  return `
    <button class="${classes}" data-plot="${plot.id}" aria-label="${label}" title="${label}">
      ${crop ? cropArt(crop.id, stage, plot) : `<span class="dirt-lines"></span>`}
      ${crop && !plot.watered && !ready && !plot.spoiled ? `<span class="water-need">WATER</span>` : ""}
      ${crop ? `<span class="day-badge">${ready ? "READY" : `${Math.max(0, crop.growthDays - plot.age)}d`}</span>` : ""}
    </button>
  `;
}

function cropArt(cropId: CropId, stage: string, plot: Plot): string {
  const crop = cropById(cropId);
  return `
    <span class="crop-art crop-art-${crop.id} ${stage}" style="--crop:${crop.color};--accent:${crop.accent}">
      <span class="stem"></span>
      <span class="leaf leaf-a"></span>
      <span class="leaf leaf-b"></span>
      <span class="fruit fruit-a"></span>
      <span class="fruit fruit-b"></span>
      <span class="grain grain-a"></span>
      <span class="grain grain-b"></span>
      <span class="grain grain-c"></span>
      <span class="crop-label">${plot.spoiled ? "BAD" : crop.short}</span>
    </span>
  `;
}

function plotStage(plot: Plot): string {
  if (plot.spoiled) return "stage-spoiled";
  if (!plot.cropId) return "stage-empty";
  const crop = cropById(plot.cropId);
  if (plot.age <= 0) return "stage-seed";
  if (plot.age < crop.growthDays * 0.5) return "stage-sprout";
  if (plot.age < crop.growthDays) return "stage-growing";
  return "stage-ready";
}

function requestCard(request: TownRequest): string {
  const canFill = canPayNeeds(request.needs);
  return `
    <article class="request-card ${canFill ? "is-fillable" : ""}">
      <div class="request-top">
        <h3>${request.title}</h3>
        <span>Due ${request.dueDay}</span>
      </div>
      <p>${request.body}</p>
      <div class="need-list">${request.needs.map(needLabel).join("")}</div>
      <button class="button ${canFill ? "button--primary" : ""}" data-request="${request.id}" ${canFill ? "" : "disabled"}>
        ${canFill ? "Fill Request" : "Need More Food"}
      </button>
    </article>
  `;
}

function needLabel(need: ResourceNeed): string {
  const game = requireState();
  if (need.type === "crop") {
    return `<span>${cropById(need.cropId).name}: ${game.inventory[need.cropId]}/${need.amount}</span>`;
  }
  if (need.type === "freshFood") {
    return `<span>Fresh Food: ${game.freshFood}/${need.amount}</span>`;
  }
  return `<span>Pantry Food: ${game.pantryFood}/${need.amount}</span>`;
}

function clipboardPanel(game: GameState): string {
  if (game.clipboardDismissed) {
    return "";
  }
  const checks = [
    ["planted", "Plant tomatoes."],
    ["watered", "Water your first crop."],
    ["harvested", "Harvest when the plot sparkles."],
    ["request", "Complete a town request."],
    ["engine", "Build one food engine before Day 7."],
    ["preserved", "Preserve something before Day 14."],
    ["pantry", "Keep pantry food ready before the final week."]
  ] as const;
  return `
    <aside class="clipboard">
      <button class="close-button" data-action="dismiss-clipboard">Close</button>
      <h2>Farmer's First Clipboard</h2>
      ${checks
        .map(([key, label]) => `<label class="${game.checklist[key] ? "done" : ""}"><span>${game.checklist[key] ? "OK" : ""}</span>${label}</label>`)
        .join("")}
    </aside>
  `;
}

function endingMetric(label: string, value: string | number): string {
  return `<div class="ending-metric"><span>${label}</span><strong>${value}</strong></div>`;
}

function bindEvents(): void {
  app.querySelectorAll<HTMLElement>("[data-action]").forEach((element) => {
    element.addEventListener("click", () => {
      const action = element.dataset.action;
      if (action === "start") startNewGame();
      if (action === "continue") continueGame();
      if (action === "how") toggleHow();
      if (action === "end-day") endDay();
      if (action === "preserve") preserveFood();
      if (action === "sell") sellSurplus();
      if (action === "dismiss-clipboard") dismissClipboard();
      if (action === "copy") copyRecap();
      if (action === "title") {
        view = "title";
        render();
      }
    });
  });

  app.querySelectorAll<HTMLElement>("[data-mode]").forEach((element) => {
    element.addEventListener("click", () => setMode(element.dataset.mode as ActionMode));
  });

  app.querySelectorAll<HTMLElement>("[data-crop]").forEach((element) => {
    element.addEventListener("click", () => setCrop(element.dataset.crop as CropId));
  });

  app.querySelectorAll<HTMLElement>("[data-engine]").forEach((element) => {
    element.addEventListener("click", () => buildEngine(element.dataset.engine as EngineId));
  });

  app.querySelectorAll<HTMLElement>("[data-plot]").forEach((element) => {
    element.addEventListener("click", () => onPlotClick(Number(element.dataset.plot)));
  });

  app.querySelectorAll<HTMLElement>("[data-request]").forEach((element) => {
    element.addEventListener("click", () => completeRequest(element.dataset.request ?? ""));
  });
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state?.showHow) {
    state.showHow = false;
    render();
  }
  if (event.key.toLowerCase() === "n" && view === "title") {
    startNewGame();
  }
});

render();
