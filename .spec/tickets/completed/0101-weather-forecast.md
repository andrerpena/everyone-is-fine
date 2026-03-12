# Weather Forecast System

**Priority:** low
**Roadmap Item:** 143
**Created:** 2026-03-12

## Goal
Add a weather forecast that shows the next predicted weather type, giving players advance notice of incoming weather changes.

## Context
The weather system transitions between weather types based on season probabilities. Currently players only see the current weather — there's no way to anticipate changes. A simple forecast showing the next likely weather type helps players plan (e.g., harvest crops before a storm, prepare for snow).

## Plan

### Files to Modify
- `src/renderer/src/world/types.ts` — Add `forecast: WeatherType` field to `WeatherState`
- `src/renderer/src/simulation/weather/weather-system.ts` — Pre-roll next weather type on transition, store in `forecast`
- `src/renderer/src/components/status-bars/definitions/GameTimeStatusBar.tsx` — Show forecast in the status bar
- `src/renderer/src/game-state/store.ts` — Initialize `forecast` in weather state

### Existing Code to Reuse
- `simulation/weather/weather-system.ts:pickWeatherType` — rolls weather from season probabilities
- `simulation/weather/weather-system.ts:WEATHER_LABELS` — human-readable weather names
- `components/status-bars/definitions/GameTimeStatusBar.tsx` — existing weather display

### Steps
1. Add `forecast: WeatherType` to `WeatherState` interface
2. In `WeatherSystem.update`, after transitioning, pre-roll the next weather type and store it in `weather.forecast`
3. Initialize forecast in the weather state creation (in store.ts or wherever weather is initialized)
4. Display forecast in the GameTimeStatusBar: `"Clear 20°C → Cloudy"`
5. Write unit tests for forecast generation

## Acceptance Criteria
- [ ] WeatherState has a `forecast` field showing the next predicted weather
- [ ] Forecast is pre-rolled when weather transitions occur
- [ ] Forecast is displayed in the game time status bar
- [ ] Unit tests verify forecast is set on weather transitions
