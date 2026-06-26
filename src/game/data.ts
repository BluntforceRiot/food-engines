export const SAVE_KEY = "food-engines.currentRun.v1";
export const BEST_KEY = "food-engines.bestScore.v1";
export const RUN_DAYS = 21;
export const DAILY_ACTIONS = 6;
export const GRID_COLUMNS = 10;
export const GRID_ROWS = 8;

export type CropId =
  | "tomatoes"
  | "corn"
  | "beans"
  | "potatoes"
  | "lettuce"
  | "wheat"
  | "apples"
  | "pumpkins";

export type ResourceNeed =
  | { type: "crop"; cropId: CropId; amount: number }
  | { type: "freshFood"; amount: number }
  | { type: "pantryFood"; amount: number };

export type Reward = {
  money?: number;
  water?: number;
  seeds?: number;
  pantryFood?: number;
  foodSecurity?: number;
  townFed?: number;
  marketTrust?: number;
  soilHealth?: number;
  countyFairPride?: number;
};

export type Crop = {
  id: CropId;
  name: string;
  short: string;
  color: string;
  accent: string;
  cost: number;
  seedCost: number;
  growthDays: number;
  waterNeed: number;
  yield: number;
  freshValue: number;
  pantryValue: number;
  sellValue: number;
  spoilageRate: number;
  traits: string[];
  tagline: string;
};

export type EngineId =
  | "compost"
  | "rotation"
  | "rainBarrel"
  | "well"
  | "irrigation"
  | "seedShed"
  | "greenhouse"
  | "soupPot"
  | "bakery"
  | "communityKitchen"
  | "cannery"
  | "rootCellar"
  | "farmStand"
  | "csaBoard"
  | "marketStall";

export type Engine = {
  id: EngineId;
  name: string;
  category: string;
  cost: number;
  flavor: string;
  effect: string;
};

export type WeatherId =
  | "sunny"
  | "rain"
  | "heat"
  | "cool"
  | "storm"
  | "perfect"
  | "dryWind"
  | "fair";

export type Weather = {
  id: WeatherId;
  name: string;
  flavor: string;
  effect: string;
};

export type RequestTemplate = {
  id: string;
  title: string;
  body: string;
  duration: number;
  needs: ResourceNeed[];
  rewards: Reward;
  success: string;
  failure: string;
};

export type Synergy = {
  id: string;
  name: string;
  requirements: {
    engines?: EngineId[];
    cropsHarvested?: CropId[];
  };
  reward: Reward & { score?: number };
  bulletin: string;
};

export const CROPS: Crop[] = [
  {
    id: "tomatoes",
    name: "Tomatoes",
    short: "TM",
    color: "#d94135",
    accent: "#ffb49c",
    cost: 2,
    seedCost: 1,
    growthDays: 2,
    waterNeed: 1,
    yield: 4,
    freshValue: 2,
    pantryValue: 3,
    sellValue: 3,
    spoilageRate: 0.18,
    traits: ["fast", "canning", "soup"],
    tagline: "Red, round, strategically important."
  },
  {
    id: "corn",
    name: "Corn",
    short: "CN",
    color: "#f2c94c",
    accent: "#2f9e44",
    cost: 3,
    seedCost: 2,
    growthDays: 3,
    waterNeed: 1,
    yield: 6,
    freshValue: 2,
    pantryValue: 2,
    sellValue: 4,
    spoilageRate: 0.12,
    traits: ["high yield", "meals"],
    tagline: "America's favorite vertical carbohydrate."
  },
  {
    id: "beans",
    name: "Beans",
    short: "BN",
    color: "#5aa85f",
    accent: "#d6f5cb",
    cost: 2,
    seedCost: 1,
    growthDays: 3,
    waterNeed: 1,
    yield: 4,
    freshValue: 2,
    pantryValue: 3,
    sellValue: 3,
    spoilageRate: 0.1,
    traits: ["soil helper", "protein"],
    tagline: "Protein with civic benefits."
  },
  {
    id: "potatoes",
    name: "Potatoes",
    short: "PT",
    color: "#b9895a",
    accent: "#f2d0a4",
    cost: 3,
    seedCost: 1,
    growthDays: 3,
    waterNeed: 1,
    yield: 5,
    freshValue: 1,
    pantryValue: 5,
    sellValue: 3,
    spoilageRate: 0.05,
    traits: ["stores well", "root cellar"],
    tagline: "The root cellar's emotional support vegetable."
  },
  {
    id: "lettuce",
    name: "Lettuce",
    short: "LT",
    color: "#8bdc65",
    accent: "#ecffd8",
    cost: 1,
    seedCost: 1,
    growthDays: 1,
    waterNeed: 1,
    yield: 3,
    freshValue: 3,
    pantryValue: 0,
    sellValue: 2,
    spoilageRate: 0.32,
    traits: ["fast", "heat-sensitive"],
    tagline: "Crisp until the weather has opinions."
  },
  {
    id: "wheat",
    name: "Wheat",
    short: "WH",
    color: "#e2b94f",
    accent: "#fff1aa",
    cost: 2,
    seedCost: 1,
    growthDays: 2,
    waterNeed: 1,
    yield: 4,
    freshValue: 1,
    pantryValue: 3,
    sellValue: 3,
    spoilageRate: 0.06,
    traits: ["bread", "diner rolls"],
    tagline: "Future toast with zoning permits."
  },
  {
    id: "apples",
    name: "Apples",
    short: "AP",
    color: "#c9342f",
    accent: "#ffe2e0",
    cost: 5,
    seedCost: 2,
    growthDays: 4,
    waterNeed: 1,
    yield: 6,
    freshValue: 2,
    pantryValue: 3,
    sellValue: 5,
    spoilageRate: 0.08,
    traits: ["pie", "cider", "fair"],
    tagline: "County fair currency."
  },
  {
    id: "pumpkins",
    name: "Pumpkins",
    short: "PK",
    color: "#e87428",
    accent: "#ffd2a6",
    cost: 4,
    seedCost: 2,
    growthDays: 4,
    waterNeed: 1,
    yield: 7,
    freshValue: 1,
    pantryValue: 4,
    sellValue: 6,
    spoilageRate: 0.07,
    traits: ["slow", "fair", "big yield"],
    tagline: "Large orange civic morale unit."
  }
];

export const ENGINES: Engine[] = [
  {
    id: "compost",
    name: "Compost Bin",
    category: "Soil",
    cost: 18,
    flavor: "Yesterday's lettuce regret becomes tomorrow's tomato confidence.",
    effect: "Spoilage feeds soil health at end of day."
  },
  {
    id: "rotation",
    name: "Crop Rotation Sign",
    category: "Soil",
    cost: 20,
    flavor: "The field has been asked politely not to become dirt-flavored sadness.",
    effect: "Varied harvests add soil and food security."
  },
  {
    id: "rainBarrel",
    name: "Rain Barrel",
    category: "Water",
    cost: 16,
    flavor: "The most respected barrel in town.",
    effect: "Rain and storms store extra water."
  },
  {
    id: "well",
    name: "Well",
    category: "Water",
    cost: 24,
    flavor: "Hole in ground. Civilization follows.",
    effect: "Adds 3 water every morning."
  },
  {
    id: "irrigation",
    name: "Irrigation Ditch",
    category: "Water",
    cost: 30,
    flavor: "Tiny canal, huge smugness.",
    effect: "Watering costs no water every other use."
  },
  {
    id: "seedShed",
    name: "Seed Saving Shed",
    category: "Seed",
    cost: 22,
    flavor: "Independence begins when tomatoes stop billing you.",
    effect: "Harvests sometimes return seeds."
  },
  {
    id: "greenhouse",
    name: "Greenhouse",
    category: "Seed",
    cost: 34,
    flavor: "A tiny glass republic for delicate plants.",
    effect: "Protects several crops from harsh weather."
  },
  {
    id: "soupPot",
    name: "Soup Pot",
    category: "Kitchen",
    cost: 18,
    flavor: "Hot civic glue.",
    effect: "Preservation converts mixed produce more efficiently."
  },
  {
    id: "bakery",
    name: "Bakery",
    category: "Kitchen",
    cost: 28,
    flavor: "Turns grain into morale.",
    effect: "Wheat and apples make requests pay more trust."
  },
  {
    id: "communityKitchen",
    name: "Community Kitchen",
    category: "Kitchen",
    cost: 36,
    flavor: "Where surplus becomes supper.",
    effect: "Town requests add extra Town Fed."
  },
  {
    id: "cannery",
    name: "Cannery",
    category: "Preservation",
    cost: 30,
    flavor: "Summer panic sealed in jars.",
    effect: "Preserve action creates more pantry food."
  },
  {
    id: "rootCellar",
    name: "Root Cellar",
    category: "Preservation",
    cost: 26,
    flavor: "Underground confidence.",
    effect: "Spoilage drops and root crops preserve better."
  },
  {
    id: "farmStand",
    name: "Roadside Farm Stand",
    category: "Market",
    cost: 20,
    flavor: "Honor-system capitalism with tomatoes.",
    effect: "Selling surplus food pays better."
  },
  {
    id: "csaBoard",
    name: "CSA Chalkboard",
    category: "Market",
    cost: 24,
    flavor: "Subscription vegetables, but neighborly.",
    effect: "Completed requests build more Market Trust."
  },
  {
    id: "marketStall",
    name: "County Market Stall",
    category: "Market",
    cost: 32,
    flavor: "Now the town knows you have tomatoes.",
    effect: "Better prices, but demand pressure rises."
  }
];

export const WEATHER: Weather[] = [
  {
    id: "sunny",
    name: "Sunny",
    flavor: "The radio says sunny. The lettuce looks nervous.",
    effect: "Normal growth. Soil dries a bit."
  },
  {
    id: "rain",
    name: "Rain",
    flavor: "Rain barrels are accepting donations from the sky.",
    effect: "Free watering. Rain barrels refill."
  },
  {
    id: "heat",
    name: "Heat Wave",
    flavor: "Heat wave arrives with the personality of a parking lot.",
    effect: "Extra water pressure. Lettuce suffers."
  },
  {
    id: "cool",
    name: "Cool Morning",
    flavor: "Cool morning. The pantry takes a deep breath.",
    effect: "Slower growth, lower spoilage."
  },
  {
    id: "storm",
    name: "Storm",
    flavor: "Storm clouds roll in. The corn seems into it.",
    effect: "Water refills. A crop may take damage."
  },
  {
    id: "perfect",
    name: "Perfect Farm Day",
    flavor: "Perfect farm day. Even the scarecrow looks employed.",
    effect: "Growth boost and Farm Joy."
  },
  {
    id: "dryWind",
    name: "Dry Wind",
    flavor: "Dry wind moves through like a committee against moisture.",
    effect: "Water drains and soil stress rises."
  },
  {
    id: "fair",
    name: "County Fair Weather",
    flavor: "County fair weather. The pies are beginning to believe.",
    effect: "Market Trust and fair pride bonus."
  }
];

export const REQUEST_TEMPLATES: RequestTemplate[] = [
  {
    id: "school-pasta",
    title: "School Lunch Board",
    body: "Cafeteria pasta day needs tomatoes and wheat before the trays revolt.",
    duration: 4,
    needs: [
      { type: "crop", cropId: "tomatoes", amount: 8 },
      { type: "crop", cropId: "wheat", amount: 5 }
    ],
    rewards: { money: 18, foodSecurity: 5, townFed: 10, marketTrust: 3 },
    success: "School lunch saved by aggressive wheat policy.",
    failure: "School lunch lady requests tomatoes with the intensity of a field marshal."
  },
  {
    id: "firehouse-chili",
    title: "Firehouse Chili Night",
    body: "The firehouse needs beans, tomatoes, and corn. The ladle is waiting.",
    duration: 4,
    needs: [
      { type: "crop", cropId: "beans", amount: 6 },
      { type: "crop", cropId: "tomatoes", amount: 6 },
      { type: "crop", cropId: "corn", amount: 4 }
    ],
    rewards: { money: 22, foodSecurity: 6, townFed: 12, marketTrust: 4 },
    success: "Firehouse chili night has entered the victory phase.",
    failure: "Firehouse chili night has entered the bean procurement panic phase."
  },
  {
    id: "diner-pie",
    title: "Diner Pie Case",
    body: "Apples and wheat can keep the pie case from becoming a rumor.",
    duration: 5,
    needs: [
      { type: "crop", cropId: "apples", amount: 5 },
      { type: "crop", cropId: "wheat", amount: 5 }
    ],
    rewards: { money: 26, foodSecurity: 4, townFed: 8, marketTrust: 6, countyFairPride: 5 },
    success: "Diner coffee remains available. Society holds.",
    failure: "County fair judge says the pie situation is promising but emotionally unstable."
  },
  {
    id: "pantry-drive",
    title: "Food Pantry Drive",
    body: "The pantry wants shelf-stable confidence before the final week.",
    duration: 5,
    needs: [{ type: "pantryFood", amount: 24 }],
    rewards: { money: 12, foodSecurity: 12, townFed: 8, marketTrust: 5 },
    success: "Food pantry enters winter with dangerous levels of confidence.",
    failure: "Grocery truck is late. Your lettuce suddenly has strategic importance."
  },
  {
    id: "baseball-stand",
    title: "Baseball Concession Stand",
    body: "The little league booth requests corn and potatoes with a side of optimism.",
    duration: 4,
    needs: [
      { type: "crop", cropId: "corn", amount: 8 },
      { type: "crop", cropId: "potatoes", amount: 5 }
    ],
    rewards: { money: 24, foodSecurity: 5, townFed: 9, marketTrust: 4 },
    success: "Baseball concession stand reports strong potato morale.",
    failure: "Neighbors ask if your potato pile is a business or a warning."
  },
  {
    id: "town-picnic",
    title: "Town Picnic",
    body: "A proper picnic wants lettuce, tomatoes, corn, and some pie-adjacent courage.",
    duration: 5,
    needs: [
      { type: "crop", cropId: "lettuce", amount: 5 },
      { type: "crop", cropId: "tomatoes", amount: 5 },
      { type: "crop", cropId: "corn", amount: 5 }
    ],
    rewards: { money: 20, foodSecurity: 6, townFed: 14, marketTrust: 5, countyFairPride: 4 },
    success: "Town picnic confirms that salad can be infrastructure.",
    failure: "Lettuce files a formal complaint against the picnic committee."
  },
  {
    id: "harvest-supper",
    title: "Harvest Supper",
    body: "Mixed crops, big table, checkered cloth. Bring enough to quiet the casserole math.",
    duration: 4,
    needs: [{ type: "freshFood", amount: 30 }],
    rewards: { money: 18, foodSecurity: 8, townFed: 16, marketTrust: 4 },
    success: "Community supper turns surplus into applause.",
    failure: "Harvest supper committee begins discussing emergency crackers."
  },
  {
    id: "fair-booth",
    title: "County Fair Booth",
    body: "Pumpkins and apples can make the booth look dangerously competent.",
    duration: 5,
    needs: [
      { type: "crop", cropId: "pumpkins", amount: 6 },
      { type: "crop", cropId: "apples", amount: 4 }
    ],
    rewards: { money: 30, foodSecurity: 4, townFed: 6, marketTrust: 7, countyFairPride: 12 },
    success: "County fair pie table stabilizes local morale.",
    failure: "Blue ribbon confidence downgraded to beige participant ribbon."
  }
];

export const SYNERGIES: Synergy[] = [
  {
    id: "sauce-sovereignty",
    name: "Sauce Sovereignty",
    requirements: { engines: ["cannery"], cropsHarvested: ["tomatoes"] },
    reward: { foodSecurity: 5, marketTrust: 3, score: 75 },
    bulletin: "Cannery turned tomato panic into sauce sovereignty."
  },
  {
    id: "bread-independence",
    name: "Bread Independence",
    requirements: { engines: ["bakery"], cropsHarvested: ["wheat"] },
    reward: { townFed: 5, marketTrust: 4, score: 75 },
    bulletin: "Bakery converts future toast into civic momentum."
  },
  {
    id: "water-loop",
    name: "Water Loop",
    requirements: { engines: ["rainBarrel", "irrigation"] },
    reward: { water: 8, foodSecurity: 4, score: 80 },
    bulletin: "Rain barrel and irrigation ditch form a tiny water loop with opinions."
  },
  {
    id: "soil-recovery",
    name: "Soil Recovery",
    requirements: { engines: ["compost"], cropsHarvested: ["beans"] },
    reward: { soilHealth: 8, foodSecurity: 3, score: 80 },
    bulletin: "Beans and compost negotiate a soil recovery treaty."
  },
  {
    id: "winter-confidence",
    name: "Winter Confidence",
    requirements: { engines: ["rootCellar"], cropsHarvested: ["potatoes"] },
    reward: { pantryFood: 10, foodSecurity: 5, score: 90 },
    bulletin: "Potatoes and root cellar create underground confidence."
  },
  {
    id: "soup-republic",
    name: "Soup Republic",
    requirements: { engines: ["communityKitchen"], cropsHarvested: ["tomatoes", "beans", "corn"] },
    reward: { townFed: 8, foodSecurity: 6, score: 100 },
    bulletin: "Community kitchen declares the Soup Republic open for business."
  },
  {
    id: "market-trust-loop",
    name: "Market Trust Loop",
    requirements: { engines: ["farmStand", "csaBoard"] },
    reward: { marketTrust: 8, money: 12, score: 80 },
    bulletin: "Farm stand and CSA chalkboard produce honor-system capitalism with receipts."
  },
  {
    id: "pie-diplomacy",
    name: "Pie Diplomacy",
    requirements: { engines: ["bakery"], cropsHarvested: ["apples"] },
    reward: { countyFairPride: 8, marketTrust: 4, score: 75 },
    bulletin: "Apples and bakery unlock pie diplomacy."
  }
];

export const BULLETIN_START = [
  "School lunch lady requests tomatoes with the intensity of a field marshal.",
  "Grocery truck is late. Your lettuce suddenly has strategic importance.",
  "Diner coffee remains available. Society holds."
];

export const EXTRA_BULLETINS = [
  "Heat wave arrives. Lettuce files a formal complaint.",
  "Neighbors ask if your potato pile is a business or a warning.",
  "Rain barrel has become the most respected barrel in town.",
  "Canning day converts summer panic into winter confidence.",
  "Farm stand sells out. Three citizens now claim they knew you before tomatoes were cool.",
  "Firehouse chili night has entered the bean procurement phase."
];

export function cropById(id: CropId): Crop {
  const crop = CROPS.find((item) => item.id === id);
  if (!crop) {
    throw new Error(`Unknown crop: ${id}`);
  }
  return crop;
}

export function engineById(id: EngineId): Engine {
  const engine = ENGINES.find((item) => item.id === id);
  if (!engine) {
    throw new Error(`Unknown engine: ${id}`);
  }
  return engine;
}

export function weatherById(id: WeatherId): Weather {
  const weather = WEATHER.find((item) => item.id === id);
  if (!weather) {
    throw new Error(`Unknown weather: ${id}`);
  }
  return weather;
}

export function deterministicWeather(day: number): WeatherId {
  const pattern: WeatherId[] = [
    "sunny",
    "rain",
    "sunny",
    "perfect",
    "heat",
    "cool",
    "dryWind",
    "rain",
    "storm",
    "sunny",
    "fair",
    "heat",
    "cool",
    "rain",
    "perfect",
    "dryWind",
    "storm",
    "sunny",
    "fair",
    "heat",
    "perfect"
  ];
  return pattern[(day - 1) % pattern.length];
}
