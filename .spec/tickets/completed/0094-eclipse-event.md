# Eclipse Event

**Priority:** medium
**Roadmap Item:** 210
**Created:** 2026-03-12

## Goal
Add an eclipse event that temporarily plunges the map into darkness, giving colonists a mood debuff and reducing plant growth for the duration.

## Context
The event system framework was just added (ticket 0093) with a wanderer joins event. Adding a second event — eclipse — exercises the system with a time-limited environmental effect rather than a one-shot effect. Eclipses affect ambient lighting, colonist mood, and plant growth, touching multiple existing systems.

## Plan

### Files to Modify
- `src/renderer/src/simulation/events/event-definitions.ts` — Add eclipse event definition with start/end tracking
- `src/renderer/src/simulation/events/event-system.ts` — Add active event tracking (events with duration) and pass active events through context
- `src/renderer/src/simulation/thoughts/thought-definitions.ts` — Add "eclipse" thought (negative mood)
- `src/renderer/src/components/pixi/renderers/ambient-lighting.ts` — Accept optional eclipse modifier to darken the overlay
- `src/renderer/src/simulation/index.ts` — Export new types if needed

### Existing Code to Reuse
- `simulation/events/event-definitions.ts:EventDefinition` — base event interface to extend
- `simulation/events/event-system.ts:EventSystem` — cooldown tracking, event evaluation
- `components/pixi/renderers/ambient-lighting.ts:getAmbientLighting` — current lighting system
- `simulation/thoughts/thought-definitions.ts:ThoughtId` — thought type union
- `simulation/thoughts/thought-system.ts:addTimedThought` — add mood effect to colonists
- `lib/log-store.ts:useLogStore` — log event start/end

### Steps
1. Add `"eclipse"` to ThoughtId union and THOUGHT_DEFINITIONS (mood -0.05, duration matches eclipse duration)
2. Extend EventDefinition with optional `durationTicks` field for time-limited events
3. Add active event tracking to EventSystem (Map of event id → end tick)
4. Create eclipse event definition: cooldown 18000 ticks (~5 min), duration 3600 ticks (~1 min), 5% chance per evaluation, applies "eclipse" thought to all colonists
5. Add `getActiveEvents()` method to EventSystem so renderers can query active eclipses
6. Modify `getAmbientLighting` to accept an optional eclipse flag that adds extra darkness overlay
7. Wire eclipse state into the ambient lighting renderer
8. Write unit tests for eclipse eligibility and duration tracking

## Acceptance Criteria
- [ ] Eclipse event triggers periodically with configurable chance
- [ ] During eclipse, ambient lighting darkens significantly
- [ ] Colonists receive negative mood thought during eclipse
- [ ] Eclipse ends after its duration, restoring normal lighting
- [ ] Event start and end are logged
- [ ] Unit tests cover eclipse event conditions and active event tracking
