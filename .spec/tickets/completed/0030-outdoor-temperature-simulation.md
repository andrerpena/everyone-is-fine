# Outdoor Temperature Simulation

**Priority:** medium
**Roadmap Item:** 136
**Created:** 2026-03-11

## Goal
Make outdoor temperature vary dynamically based on season and time of day, replacing the static 20°C default.

## Context
WeatherState.temperature exists but is always 20°C (set in createWeatherState). Seasons and day/night cycle already work. This adds a getOutdoorTemperature function that computes temperature from season + hour, updates it each tick, and displays it in the status bar.

## Plan

### Files to Create
- `src/renderer/src/simulation/time/temperature.ts` — Pure function computing outdoor temp from season + hour

### Files to Modify
- `src/renderer/src/game-state/store.ts` — Update weather.temperature each tick using the new function
- `src/renderer/src/components/status-bars/definitions/GameTimeStatusBar.tsx` — Display temperature alongside time

### Steps
1. Create getOutdoorTemperature(season, hour): returns °C. Base temps by season (spring ~15, summer ~25, autumn ~12, winter ~-2). Day/night variation: ±5°C (warmest at 14:00, coldest at 04:00, sinusoidal)
2. In the simulation tick callback, update world.weather.temperature from getOutdoorTemperature
3. In GameTimeStatusBar, append temperature to the display string
4. Add unit tests for getOutdoorTemperature

## Acceptance Criteria
- [ ] Temperature varies by season (summer hottest, winter coldest)
- [ ] Temperature varies by time of day (warmest afternoon, coldest pre-dawn)
- [ ] Temperature displayed in game time status bar
- [ ] Unit tests pass
- [ ] Typecheck and lint pass
