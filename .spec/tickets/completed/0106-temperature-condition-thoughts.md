# Temperature Condition Thoughts (Heatstroke & Hypothermia)

**Priority:** medium
**Roadmap Item:** 142
**Created:** 2026-03-12

## Goal
Add condition-based thoughts for extreme temperatures so colonists get mood penalties when exposed to very hot or cold environments.

## Context
Indoor temperature (v0.98.0) and outdoor temperature already exist. The thought system supports condition-based thoughts evaluated each tick. Adding temperature awareness to the environment context lets colonists react to heat/cold with mood effects, creating gameplay pressure to build shelter and (eventually) heaters/coolers.

## Plan

### Files to Modify
- `src/renderer/src/simulation/thoughts/thought-definitions.ts` — Add 4 temperature thoughts: `freezing`, `cold`, `hot`, `sweltering`
- `src/renderer/src/simulation/thoughts/thought-system.ts` — Add `temperature` to `EnvironmentContext`, evaluate temperature thoughts, update `getEnvironmentContext` to include temperature from room or outdoor
- `src/renderer/src/game-state/store.ts` — Pass outdoor temperature to MoodThoughtSystem so it can compute environment context

### Existing Code to Reuse
- `src/renderer/src/simulation/thoughts/thought-system.ts:evaluateConditionThoughts` — Add temperature evaluation
- `src/renderer/src/simulation/rooms/room-detection-system.ts:getRoomAt` — Room with temperature field
- `src/renderer/src/game-state/store.ts` — `world.weather.temperature` for outdoor temp

### Steps
1. Add 4 temperature thought definitions (freezing, cold, hot, sweltering) with escalating mood penalties
2. Add `temperature: number | null` to `EnvironmentContext`
3. Update `getEnvironmentContext` to compute temperature: use room.temperature for indoor, or outdoor temp for outdoor/no room
4. Add temperature threshold checks to `evaluateConditionThoughts`
5. Pass outdoor temperature to MoodThoughtSystem (via constructor or update param)
6. Write unit tests

## Acceptance Criteria
- [ ] Colonists get `freezing` thought below -10°C (mood -0.15)
- [ ] Colonists get `cold` thought between -10°C and 5°C (mood -0.06)
- [ ] Colonists get `hot` thought between 35°C and 45°C (mood -0.06)
- [ ] Colonists get `sweltering` thought above 45°C (mood -0.15)
- [ ] Comfortable range (5-35°C) produces no temperature thought
- [ ] Indoor temperature is used for roofed rooms
- [ ] Unit tests verify threshold logic
