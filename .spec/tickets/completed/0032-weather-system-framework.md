# Weather System Framework

**Priority:** medium
**Roadmap Item:** 137
**Created:** 2026-03-11

## Goal
Add a tick-based weather simulation that dynamically transitions between weather types based on season, replacing the hardcoded "clear" weather.

## Context
WeatherState and WeatherType are already defined in `world/types.ts` with types: clear, cloudy, rain, storm, snow, fog, heatwave. Currently `weather.type` is always "clear" (set in `world-factory.ts`, never changed). Temperature already updates dynamically per season/hour. This ticket adds the simulation that transitions weather types over time, with season-appropriate probabilities. Visual effects (rain particles, etc.) are out of scope — this is the data/logic layer only.

## Plan

### Files to Create
- `src/renderer/src/simulation/weather/weather-system.ts` — Tick-based weather simulation that periodically evaluates weather transitions
- `src/renderer/src/simulation/weather/weather-system.test.ts` — Unit tests

### Files to Modify
- `src/renderer/src/simulation/index.ts` — Export WeatherSystem
- `src/renderer/src/game-state/store.ts` — Instantiate WeatherSystem and call it in tick callback
- `src/renderer/src/components/status-bars/definitions/GameTimeStatusBar.tsx` — Show weather type alongside temperature

### Existing Code to Reuse
- `src/renderer/src/world/types.ts:WeatherType` — The 7 weather types already defined
- `src/renderer/src/world/types.ts:WeatherState` — intensity, windSpeed, windDirection fields
- `src/renderer/src/simulation/time/time-system.ts:advanceTime` — Time progression already in tick
- `src/renderer/src/simulation/time/temperature.ts:getOutdoorTemperature` — Season-based temp

### Steps
1. Create `WeatherSystem` class with a check interval (~every 600 ticks / ~10 seconds)
2. Define season→weather probability tables (e.g., summer: 60% clear, 15% cloudy, 15% rain, 5% storm, 5% heatwave; winter: 20% clear, 25% cloudy, 20% snow, 15% fog, 10% rain, 10% storm)
3. On each check, roll a random number and potentially transition to a new weather type based on current season probabilities
4. When transitioning, also update intensity (0.3-1.0 random), windSpeed (0-20), and windDirection (0-360)
5. Add minimum duration (~1800 ticks / ~30 seconds) so weather doesn't flicker rapidly
6. Integrate into store tick callback (after time advancement, before temperature)
7. Adjust temperature based on weather (rain → -2°C, storm → -4°C, fog → -1°C, heatwave → +5°C, snow → -3°C)
8. Update status bar to show weather type icon/label (e.g., "Day 3, 14:30, Spring Year 1 | ☀ 20°C")
9. Write unit tests for transition logic and temperature modifiers

## Acceptance Criteria
- [ ] Weather type changes dynamically during gameplay based on season
- [ ] Each season has distinct weather probability distributions
- [ ] Weather persists for a minimum duration before changing
- [ ] Temperature is modified by current weather type
- [ ] Weather type visible in status bar
- [ ] Typecheck and lint pass
