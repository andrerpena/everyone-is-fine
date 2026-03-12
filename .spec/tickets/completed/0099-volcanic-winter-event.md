# Volcanic Winter Event

**Priority:** medium
**Roadmap Item:** 216
**Created:** 2026-03-12

## Goal
Add a volcanic winter event that reduces outdoor temperature and applies a mood penalty, creating a long-duration environmental hazard that threatens crops and colonist comfort.

## Context
The event system has 4 events (wanderer joins, eclipse, psychic drone, toxic fallout). Adding volcanic winter creates a temperature-affecting event — when active, outdoor temperature drops significantly, which can cause crops to wilt (plant growth system already uses temperature). The mood penalty reflects the gloomy, ash-covered skies.

## Plan

### Files to Modify
- `src/renderer/src/simulation/events/event-definitions.ts` — Add volcanic winter event definition with constants
- `src/renderer/src/simulation/thoughts/thought-definitions.ts` — Add "volcanic_winter" thought type
- `src/renderer/src/game-state/store.ts` — Apply temperature offset when volcanic winter event is active

### Existing Code to Reuse
- `simulation/events/event-definitions.ts:addThoughtToAllColonists` — apply thought to all colonists
- `simulation/events/event-definitions.ts:EventDefinition` — event interface
- `simulation/events/event-system.ts:EventSystem.isEventActive` — check if event is currently active
- `game-state/store.ts:temperature calculation` — line ~808, already sums base temp + weather modifier
- `simulation/time/temperature.ts:getOutdoorTemperature` — base temperature function

### Steps
1. Add "volcanic_winter" to ThoughtId union and THOUGHT_DEFINITIONS (mood -0.06, duration 14400s matching event)
2. Create volcanic winter event definition: negative category, 36000-tick cooldown (~10 min), 14400-tick duration (~4 minutes), 3% chance, applies thought to all colonists
3. Add to ALL_EVENTS registry
4. In store.ts temperature calculation, check `eventSystem.isEventActive("volcanic_winter")` and subtract a temperature offset (e.g., -15°C) when active
5. Write unit tests for volcanic winter event and temperature offset

## Acceptance Criteria
- [ ] Volcanic winter event triggers and applies mood penalty to all colonists
- [ ] Outdoor temperature drops by 15°C while the event is active
- [ ] Event is categorized as "negative" for storyteller integration
- [ ] Event has longer duration than toxic fallout (4 minutes vs 3 minutes)
- [ ] Unit tests cover event conditions and temperature offset logic
