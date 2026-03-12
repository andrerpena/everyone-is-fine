# Crafting Recipe Registry

**Priority:** medium
**Roadmap Item:** 83
**Created:** 2026-03-12

## Goal
Create a recipe registry that defines crafting recipes with ingredient requirements, and update the cooking system to use recipes so colonists can produce fine meals and lavish meals (not just simple meals).

## Context
Currently the cooking system is hard-coded to produce only `meal_simple` from any raw food near a campfire. Meal types `meal_fine` and `meal_lavish` exist in the item registry but can never be produced. A recipe registry will define what ingredients each recipe needs and what it produces, making the cooking system data-driven and extensible to future workstations.

## Plan

### Files to Create
- `src/renderer/src/world/registries/recipe-registry.ts` — Recipe definitions mapping workstation → recipes with ingredients and outputs

### Files to Modify
- `src/renderer/src/simulation/jobs/cooking-system.ts` — Use recipe registry instead of hard-coded meal_simple production
- `src/renderer/src/simulation/jobs/job-factory.ts` — Update createCookJob to accept recipe info (output item type, work ticks)

### Existing Code to Reuse
- `src/renderer/src/world/registries/item-registry.ts` — Item definitions with nutrition values
- `src/renderer/src/simulation/jobs/cooking-system.ts:findRawFoodNear` — Already finds raw food items near workstations
- `src/renderer/src/simulation/jobs/job-factory.ts:createCookJob` — Existing cook job factory
- `src/renderer/src/simulation/work-priorities.ts:pickBestCharacter` — Character selection

### Steps
1. Create `recipe-registry.ts` with a `CraftingRecipe` interface:
   - `id`: unique recipe identifier
   - `label`: display name
   - `workstation`: which StructureType this recipe uses (e.g., "campfire")
   - `ingredients`: array of `{ itemType: ItemType, count: number }`
   - `output`: `{ itemType: ItemType, count: number }`
   - `workTicks`: base ticks to complete
   - `skillId`: which skill affects speed/quality
   - `minSkillLevel`: minimum skill to attempt (0 for all)
   Define recipes for: meal_simple (1 raw food, 180 ticks), meal_fine (2 raw food, 300 ticks, min cooking 4), meal_lavish (3 raw food, 450 ticks, min cooking 8)
2. Update `createCookJob` in job-factory.ts to accept the output item type and work ticks from the recipe
3. Update cooking-system.ts to:
   - Import and iterate recipes for the workstation type
   - For each recipe, check if enough ingredients exist nearby and colonist meets min skill
   - Pick the best recipe the colonist can make (prefer higher-tier if ingredients available)
   - Pass recipe info to createCookJob
4. Write unit tests for recipe selection logic

## Acceptance Criteria
- [ ] Recipe registry defines meal_simple, meal_fine, meal_lavish recipes
- [ ] Cooking system uses recipes instead of hard-coded logic
- [ ] Fine meals require 2 raw food items and cooking skill ≥ 4
- [ ] Lavish meals require 3 raw food items and cooking skill ≥ 8
- [ ] Simple meals still work as before (1 raw food, no skill requirement)
- [ ] Unit tests pass
- [ ] Quality gate passes (lint:fix + typecheck)
