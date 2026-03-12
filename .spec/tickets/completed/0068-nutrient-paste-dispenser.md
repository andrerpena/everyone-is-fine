# Nutrient Paste Dispenser Building

**Priority:** medium
**Roadmap Item:** 110
**Created:** 2026-03-12

## Goal
Add a nutrient paste dispenser as a buildable structure that produces nutrient paste meals with an associated negative mood thought for eating them.

## Context
The `nutrient_paste` item already exists in the item registry (value 1, nutrition 0.8, never spoils). This ticket adds the building structure and a mood penalty thought for eating nutrient paste. The cooking system already has a pattern of scanning for campfires and assigning cook jobs — the dispenser will follow a similar pattern but produce nutrient_paste instead of meal_simple.

## Plan

### Files to Modify
- `src/renderer/src/world/types.ts` — Add `"nutrient_paste_dispenser"` to StructureType union
- `src/renderer/src/world/registries/structure-registry.ts` — Add dispenser properties (machine category, interactable, moderate health)
- `src/renderer/src/world/registries/construction-registry.ts` — Add construction cost (iron + stone, high work ticks — it's advanced)
- `src/renderer/src/simulation/thoughts/thought-definitions.ts` — Add `"ate_nutrient_paste"` ThoughtId and definition (timed, negative mood)
- `src/renderer/src/simulation/jobs/job-processor.ts` — In `executeConsumeItem`, detect nutrient_paste and add the negative mood thought
- `src/renderer/src/simulation/jobs/cooking-system.ts` — Extend to also scan for dispensers and create dispenser jobs (produce nutrient_paste instead of meal_simple, no raw food needed)
- `src/renderer/src/simulation/jobs/job-factory.ts` — Add `createDispenserJob` function

### Existing Code to Reuse
- `src/renderer/src/simulation/jobs/cooking-system.ts:CookingSystem` — Same pattern for scanning and job assignment
- `src/renderer/src/simulation/jobs/job-factory.ts:createCookJob` — Template for dispenser job
- `src/renderer/src/world/types.ts:TICKS_PER_HOUR` — For thought duration
- `src/renderer/src/simulation/food-poisoning.ts` — Pattern for adding timed thoughts in executeConsumeItem

### Steps
1. Add `"nutrient_paste_dispenser"` to StructureType union in types.ts
2. Add dispenser to STRUCTURE_REGISTRY (machine, not blocking, interactable, high value)
3. Add dispenser to CONSTRUCTION_REGISTRY (iron × 5 + stone × 3, 600 work ticks)
4. Add `"ate_nutrient_paste"` to ThoughtId and THOUGHT_DEFINITIONS (moodEffect -0.08, durationSeconds 14400 = 4 hours)
5. In executeConsumeItem, after consuming nutrient_paste, add the timed thought
6. Add `createDispenserJob` to job-factory.ts (move to dispenser → work 60 ticks → spawn nutrient_paste)
7. Extend CookingSystem to also find dispensers and assign dispenser jobs when no campfire cooking is available

## Acceptance Criteria
- [ ] `nutrient_paste_dispenser` is a valid StructureType with registry entry
- [ ] Dispenser is buildable with defined construction cost
- [ ] `ate_nutrient_paste` thought exists with negative mood and timed duration
- [ ] Eating nutrient paste adds the negative mood thought
- [ ] Dispenser produces nutrient_paste via a job (no raw food required)
- [ ] Quality gate passes (lint + typecheck)
