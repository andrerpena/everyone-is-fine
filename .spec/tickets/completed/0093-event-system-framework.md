# Event System Framework

**Priority:** high
**Roadmap Item:** 205
**Created:** 2026-03-12

## Goal
Add an event system framework that periodically evaluates conditions and triggers colony events, starting with a "wanderer joins" event as the first concrete implementation.

## Context
No event system exists yet. All colony events (raids, wanderers, trade caravans, etc.) depend on this framework. The system should be data-driven with event definitions, condition checkers, and effect handlers.

## Plan

### Files to Create
- `src/renderer/src/simulation/events/event-definitions.ts` — Event type definitions and the "wanderer joins" event
- `src/renderer/src/simulation/events/event-system.ts` — EventSystem class that evaluates events periodically

### Files to Modify
- `src/renderer/src/game-state/store.ts` — Instantiate EventSystem and call it in the tick callback

### Existing Code to Reuse
- `simulation/colonist-generator.ts:generateColonistIdentity` — generate wanderer identity
- `simulation/types.ts:createCharacter` — create character entity
- `world/factories/world-factory.ts:SeededRandom` — RNG for event rolls
- `lib/log-store.ts:useLogStore` — log event occurrences
- `game-state/store.ts:entityStore` — add new characters

### Steps
1. Create event definitions with condition/effect functions and "wanderer joins" event
2. Create EventSystem class with periodic evaluation (every 600 ticks ~10 seconds)
3. "Wanderer joins" triggers when colony has < 8 colonists with small random chance, spawns a new colonist at map edge
4. Integrate EventSystem into the tick callback in store.ts
5. Write unit tests for event condition evaluation

## Acceptance Criteria
- [ ] EventSystem evaluates event conditions periodically
- [ ] "Wanderer joins" event triggers and spawns a new colonist
- [ ] Events are logged via log store
- [ ] Event framework is extensible for future event types
- [ ] Unit tests cover event eligibility logic
