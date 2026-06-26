# Food Engines

Food Engines is a bright static browser farm-grid strategy game about food independence: plant crops, build the systems behind a fed town, and discover that tomatoes are infrastructure.

Built for **Summer into AI Week 2: Independence Engines**.

## Pitch

Build the tiny food system underneath a fed town. Plant crops, store water, save seeds, can tomatoes, bake bread, fill school-lunch trays, stock the pantry, and prove that independence sometimes looks like a potato in a basement.

## How It Fits Independence Engines

Food Engines treats food freedom as an engine, not a single crop. The player builds the connected systems that keep people fed: soil, water, seeds, labor, storage, kitchens, preservation, markets, weather response, and community trust.

## Run Locally

```sh
npm ci
npm run dev
```

Then open the local Vite URL.

## Build And Verify

```sh
npm run typecheck
npm run build
npm audit --audit-level=moderate
npm run playtest
```

Optional review helpers:

```sh
npm run screenshots
npm run package:review
npm run verify:package
```

## How To Play

- Start a 21-day farm run.
- Each day gives 6 actions.
- Select a crop and click an empty dirt plot to plant.
- Click a thirsty crop to water it.
- Click a ready crop to harvest it. Harvesting costs 1 action.
- Complete Town Request Board orders for Town Fed, Food Security, Market Trust, money, and seed rewards.
- Build Food Engines to improve soil, water, seeds, kitchens, preservation, and markets.
- Use Preserve Food to convert Fresh Food into Pantry Food.
- End Day resolves growth, weather, spoilage, missed demand, and events.
- Finish Day 21 with the strongest Food Security, Town Fed, Pantry Reserves, Market Trust, Soil Health, and score you can.

## Current Systems

- 10x8 farm grid with visible crop stages.
- Eight crops: tomatoes, corn, beans, potatoes, lettuce, wheat, apples, and pumpkins.
- Weather system with rain, heat, storms, dry wind, fair weather, and perfect farm days.
- Town requests for school lunches, firehouse chili, diner pies, pantry drives, concession stands, picnics, harvest suppers, and county fair booths.
- Fifteen Food Engines across soil, water, seeds, kitchens, preservation, and markets.
- Eight engine synergies.
- Farmer's First Clipboard onboarding.
- Farm Radio / County Bulletin flavor feed.
- Local save/load and best score using browser localStorage only.
- Endgame newspaper scorecard with Copy Recap fallback.

## Privacy And Runtime

- Static browser app only.
- No backend.
- No accounts.
- No analytics.
- No telemetry.
- No remote AI/model calls.
- No external art or audio files.
- Saves are local browser storage only.

Local storage keys:

- Current run: `food-engines.currentRun.v1`
- Best score: `food-engines.bestScore.v1`

## AI Usage Note

ChatGPT/Codex were used for design expansion, implementation, review tooling, and polish. The visuals are original CSS/SVG-like procedural shapes rendered in the browser; no commercial game assets, copyrighted crop sprites, or external art packs are used.

## Known Limitations

- Balance is intentionally lightweight and arcade-board-game flavored.
- Crops use procedural CSS art rather than final illustrated sprites.
- Town requests are deterministic templates, not a large content pool.
- Save data is not migrated between future versions yet.
- Mobile layout is not the main target for this build; desktop browser play is the intended review path.

## Submission Blurb

Food Engines is a cartoon farm-grid strategy game about food independence. Players plant crops, harvest food, build water/soil/seed/kitchen/preservation/market engines, and answer town requests for school lunches, diner pies, firehouse chili, pantry drives, and county fair meals. It looks like a cheerful casual farm game, but underneath the tomatoes is a civic engine: can this little town feed itself when weather, spoilage, demand, and late grocery trucks start pushing back?

