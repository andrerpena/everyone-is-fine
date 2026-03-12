# Psychic Drone Event

**Priority:** medium
**Roadmap Item:** 217
**Created:** 2026-03-12

## Goal
Add a psychic drone event that applies a mood penalty to colonists of a randomly selected gender, adding variety to the storyteller's negative event pool.

## Context
The event system has 2 events (wanderer joins, eclipse) with a storyteller controlling pacing. Adding a psychic drone event diversifies the negative event pool and creates interesting gameplay dynamics — the player must manage the affected colonists' mood while the unaffected ones continue normally.

## Plan

### Files to Modify
- `src/renderer/src/simulation/events/event-definitions.ts` — Add psychic drone event definition, generalize `addThoughtToAllColonists` to support gender filtering
- `src/renderer/src/simulation/thoughts/thought-definitions.ts` — Add "psychic_drone" thought type

### Existing Code to Reuse
- `simulation/events/event-definitions.ts:addThoughtToAllColonists` — generalize for gender-filtered thoughts
- `simulation/events/event-definitions.ts:EventDefinition` — event interface with category field
- `simulation/types.ts:Gender` — "male" | "female" type
- `simulation/thoughts/thought-definitions.ts:ThoughtId` — thought type union

### Steps
1. Add "psychic_drone" to ThoughtId union and THOUGHT_DEFINITIONS (mood -0.12, duration matching event)
2. Generalize `addThoughtToAllColonists` to accept an optional gender filter
3. Create psychic drone event definition: negative category, 18000-tick cooldown, 5400-tick duration (~90 seconds), 4% chance, randomly picks male or female, applies thought only to that gender
4. Add to ALL_EVENTS registry
5. Write unit tests for psychic drone eligibility and gender filtering

## Acceptance Criteria
- [ ] Psychic drone event triggers and applies mood penalty to one gender only
- [ ] Event randomly selects either male or female as the affected gender
- [ ] Thought definition has appropriate mood effect and duration
- [ ] Event is categorized as "negative" for storyteller integration
- [ ] Unit tests cover gender filtering and event conditions
