# Plant Growth System

**Priority:** high
**Roadmap Item:** 99
**Created:** 2026-03-11

## Goal
Add a tick-based plant growth system with crop type definitions and growth stages, enabling plants to grow on tiles over time.

## Context
Growing zones exist as a ZoneType but have no functional behavior. The time system provides seasons, terrain has moisture values, and the weather system provides temperature. This ticket adds the simulation logic for plants growing on tiles. Sowing/harvesting jobs are deferred to future tickets.

## Plan

### Files to Modify
- `src/renderer/src/world/types.ts` — Add `CropType`, `CropData`, `GrowthStage` types and optional `crop` field to `Tile`
- `src/renderer/src/world/factories/tile-factory.ts` — Initialize `crop: null` in createTile/cloneTile
- `src/renderer/src/game-state/store.ts` — Wire PlantGrowthSystem into tick loop
- `src/renderer/src/simulation/index.ts` — Export PlantGrowthSystem
- `src/renderer/src/agent-api.ts` — Add `plantCrop(x, y, cropType)` method for agent testing
- `src/renderer/src/agent-api.types.ts` — Add plantCrop to API shape

### Files to Create
- `src/renderer/src/simulation/plants/plant-growth-system.ts` — Tick-based system advancing crop growth based on season, temperature, and terrain moisture
- `src/renderer/src/simulation/plants/crop-registry.ts` — Crop type definitions (growth time, min/max temp, yield item, yield quantity)
- `src/renderer/src/simulation/plants/plant-growth-system.test.ts` — Unit tests

### Existing Code to Reuse
- `src/renderer/src/simulation/weather/snow-accumulation-system.ts` — Pattern for periodic tile iteration system
- `src/renderer/src/world/registries/terrain-registry.ts` — Terrain fertility values
- `src/renderer/src/world/types.ts:TerrainData` — moisture field for growth rate
- `src/renderer/src/zones/zone-store.ts:useZoneStore` — Check if tile is in a growing zone

### Steps
1. Define types: `CropType` (rice, potato, corn, strawberry, healroot), `GrowthStage` (seedling, growing, mature, wilted), `CropData` (type, growthProgress 0-1, stage, plantedDay), `CropProperties` (growthTicks, minTemp, maxTemp, yieldType, yieldQuantity)
2. Create crop-registry.ts with `CROP_REGISTRY` mapping CropType to CropProperties
3. Add optional `crop: CropData | null` to Tile, initialize as null
4. Create PlantGrowthSystem: every 60 ticks, iterate tiles with crops, advance growthProgress based on temperature suitability and terrain moisture, update stage thresholds, wilt if temp outside range too long
5. Wire into store.ts tick loop
6. Add `plantCrop(x, y, cropType)` to agent API for testing
7. Write unit tests for growth progression, stage transitions, temperature effects

## Acceptance Criteria
- [ ] 5 crop types defined with growth properties
- [ ] PlantGrowthSystem advances growth each check interval
- [ ] Growth rate affected by terrain moisture
- [ ] Plants wilt when temperature is outside viable range
- [ ] Growth stages transition at correct thresholds (0-0.25 seedling, 0.25-0.75 growing, 0.75-1.0 mature)
- [ ] Agent API can plant crops for testing
- [ ] Unit tests cover growth, wilting, and stage transitions
