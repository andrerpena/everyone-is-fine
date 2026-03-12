# Toxic Fallout Event

**Priority:** medium
**Roadmap Item:** 215
**Created:** 2026-03-12

## Goal
Add a toxic fallout event that applies a mood penalty to all colonists and damages outdoor crops, adding a dangerous environmental hazard to the storyteller's negative event pool.

## Context
The event system has 3 events (wanderer joins, eclipse, psychic drone) with a storyteller controlling pacing. Adding a toxic fallout event creates a longer-duration environmental hazard that affects the entire colony — colonists get a mood debuff while the fallout persists. This is similar to the eclipse event but longer-lasting and more impactful.

## Plan

### Files to Modify
- `src/renderer/src/simulation/events/event-definitions.ts` — Add toxic fallout event definition with appropriate constants
- `src/renderer/src/simulation/thoughts/thought-definitions.ts` — Add "toxic_fallout" thought type

### Existing Code to Reuse
- `simulation/events/event-definitions.ts:addThoughtToAllColonists` — apply thought to all colonists (no gender filter)
- `simulation/events/event-definitions.ts:EventDefinition` — event interface with category field
- `simulation/events/event-definitions.ts:eclipseEvent` — pattern for duration-based negative events
- `simulation/thoughts/thought-definitions.ts:ThoughtId` — thought type union

### Steps
1. Add "toxic_fallout" to ThoughtId union and THOUGHT_DEFINITIONS (mood -0.08, duration matching event ~180 seconds = 10800 ticks / TPS)
2. Create toxic fallout event definition: negative category, 36000-tick cooldown (~10 minutes), 10800-tick duration (~180 seconds / 3 minutes), 3% chance, applies thought to all colonists
3. Add to ALL_EVENTS registry
4. Write unit tests for toxic fallout canTrigger and execute

## Acceptance Criteria
- [ ] Toxic fallout event triggers and applies mood penalty to all colonists
- [ ] Thought definition has appropriate mood effect and duration
- [ ] Event is categorized as "negative" for storyteller integration
- [ ] Event has longer duration than eclipse (3 minutes vs 1 minute)
- [ ] Unit tests cover event conditions and thought application
