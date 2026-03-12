# Storyteller AI

**Priority:** medium
**Roadmap Item:** 206
**Created:** 2026-03-12

## Goal
Add a storyteller system that controls event pacing and selection based on colony state, preventing event spam and creating a more dramatic narrative arc.

## Context
The event system currently evaluates all events independently each tick. There's no global coordination — two events could fire on the same tick, and there's no consideration of colony mood or overall pacing. A storyteller layer adds drama by spacing events out and selecting appropriate events for the colony's current situation.

## Plan

### Files to Create
- `src/renderer/src/simulation/events/storyteller.ts` — Storyteller class with event pacing and mood-based selection

### Files to Modify
- `src/renderer/src/simulation/events/event-definitions.ts` — Add `category` field to EventDefinition (positive/negative/neutral)
- `src/renderer/src/simulation/events/event-system.ts` — Integrate storyteller as the event selection layer
- `src/renderer/src/simulation/index.ts` — Export storyteller types

### Existing Code to Reuse
- `simulation/events/event-system.ts:EventSystem` — existing evaluation and cooldown logic
- `simulation/events/event-definitions.ts:EventDefinition` — event interface to extend
- `simulation/entity-store.ts:EntityStore` — read colonist mood for pacing decisions

### Steps
1. Add `category: "positive" | "negative" | "neutral"` to EventDefinition interface
2. Tag wanderer_joins as "positive", eclipse as "negative"
3. Create Storyteller class with:
   - Global minimum interval between any events (configurable, default ~1800 ticks / 30 seconds)
   - Average colony mood calculation
   - Event selection logic: when mood is high (>0.7), allow negative events; when low (<0.4), bias toward positive; otherwise any
   - A `selectEvent()` method that filters eligible events by category and returns one or null
4. Integrate storyteller into EventSystem.update() — storyteller decides IF and WHICH event to evaluate
5. Write unit tests for storyteller event selection logic

## Acceptance Criteria
- [ ] Events are categorized as positive, negative, or neutral
- [ ] Global minimum interval prevents rapid event succession
- [ ] Colony mood influences which event categories are eligible
- [ ] Storyteller integrates cleanly with existing EventSystem
- [ ] Unit tests cover mood-based event selection
