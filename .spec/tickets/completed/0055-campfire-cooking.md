# Campfire and Cooking System

**Priority:** high
**Roadmap Item:** 104, 105
**Created:** 2026-03-11

## Goal
Add a campfire structure and a cooking system that auto-assigns cooking jobs to convert raw food into simple meals.

## Context
The game has raw food items (meat, berries, vegetable) and meal items (meal_simple, meal_fine) defined but no way to cook. Adding a campfire workstation and a CookingSystem (following the SowingSystem auto-assign pattern) completes the food production chain: grow → harvest → cook → eat.

## Plan

### Files to Modify
- `src/renderer/src/world/types.ts` — Add "campfire" to StructureType union
- `src/renderer/src/world/registries/structure-registry.ts` — Add campfire structure properties
- `src/renderer/src/world/registries/construction-registry.ts` — Add campfire construction cost
- `src/renderer/src/simulation/jobs/job-factory.ts` — Add createCookJob factory
- `src/renderer/src/simulation/jobs/index.ts` — Export new function and system
- `src/renderer/src/simulation/skills.ts` — Add cook to JOB_SKILL_MAP
- `src/renderer/src/game-state/store.ts` — Wire CookingSystem into game loop

### Files to Create
- `src/renderer/src/simulation/jobs/cooking-system.ts` — Auto-assign cooking jobs (pattern: SowingSystem)

### Existing Code to Reuse
- `src/renderer/src/simulation/jobs/sowing-system.ts` — Same auto-assign pattern
- `src/renderer/src/simulation/jobs/job-factory.ts:createForageJob` — Similar step pattern
- `src/renderer/src/world/registries/item-registry.ts` — nutrition/food category checks

### Steps
1. Add "campfire" to StructureType, structure registry (category: machine, interactable), and construction registry (5 wood, 3 stone)
2. Create createCookJob: move adjacent to campfire → work 180 ticks → consume raw food from nearby tile → spawn meal_simple at campfire
3. Create CookingSystem that scans for campfires, finds nearby raw food, assigns cook jobs to idle colonists
4. Add "cook" to JOB_SKILL_MAP mapping to cooking skill
5. Wire CookingSystem into game loop
6. Write tests

## Acceptance Criteria
- [ ] Campfire can be built via blueprint system
- [ ] CookingSystem auto-assigns cook jobs when campfire exists and raw food is nearby
- [ ] Cooking job converts 1 raw food item into 1 meal_simple
- [ ] Cooking skill affects work speed
- [ ] Tests pass, lint and typecheck clean
