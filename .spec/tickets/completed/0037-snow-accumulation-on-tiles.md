# Snow Accumulation on Tiles

**Priority:** medium
**Roadmap Item:** 139
**Created:** 2026-03-11

## Goal
Add snow accumulation on tiles during snowy weather, with visual white overlay and melting when temperature rises above freezing.

## Context
The weather system (ticket 0032) supports snow as a weather type with falling particle effects (ticket 0033). However, snow doesn't accumulate on the ground — it just falls visually. Adding accumulation makes the weather system feel real: tiles gradually turn white during snowfall and melt when it warms up.

## Plan

### Files to Modify
- `src/renderer/src/world/types.ts` — Add `snowDepth: number` (0-1) field to `Tile` interface
- `src/renderer/src/simulation/weather/weather-system.ts` — Add snow accumulation/melting logic: increase snowDepth during snow weather, decrease when temp > 0°C
- `src/renderer/src/world/factories/tile-factory.ts` — Initialize `snowDepth: 0` in tile creation
- `src/renderer/src/components/pixi/World.tsx` — Add snow accumulation Graphics layer between items and zones, render white overlay per tile based on snowDepth
- `src/renderer/src/game-state/store.ts` — Pass world to weather system update for accumulation
- `src/renderer/src/simulation/weather/weather-system.test.ts` — Add tests for accumulation/melting logic

### Files to Create
None — snow rendering will be inline Graphics in World.tsx (simpler than a separate renderer class for a single overlay).

### Existing Code to Reuse
- `src/renderer/src/simulation/weather/weather-system.ts:WeatherSystem` — Already runs each tick, extend with accumulation
- `src/renderer/src/components/pixi/World.tsx:renderWorld()` — Existing tile rendering loop to add snow overlay
- `src/renderer/src/world/types.ts:Tile` — Add snowDepth field

### Steps
1. Add `snowDepth: number` to `Tile` interface, initialize to 0 in tile factory
2. Extend `WeatherSystem.update()` to accept the world and update tile snowDepth:
   - During snow weather: increase snowDepth by small amount per tick (capped at 1.0)
   - When temp > 0°C and not snowing: decrease snowDepth (melting)
   - Only accumulate on outdoor passable tiles (not water)
3. Add snow overlay rendering in World.tsx: white rectangles with alpha based on snowDepth
4. Update serialization if needed (snowDepth should persist in saves)
5. Add unit tests for accumulation rate and melting

## Acceptance Criteria
- [ ] Tiles gain snowDepth during snow weather
- [ ] Snow melts when temperature rises above 0°C
- [ ] White overlay visible on tiles with snowDepth > 0
- [ ] Snow doesn't accumulate on water tiles
- [ ] Unit tests cover accumulation and melting rates
