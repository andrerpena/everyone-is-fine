# Eating Action

**Priority:** high
**Roadmap Item:** 107
**Created:** 2026-03-11

## Goal
Colonists automatically find and eat food items on the ground when hungry, consuming the item and restoring hunger based on its nutrition value.

## Context
Colonists currently satisfy hunger only by foraging bushes (infinite, renewable, 0.3 hunger restored). Food items exist on tiles (meat, berries, vegetables, meals) with nutrition values in the item registry, but colonists cannot eat them. This ticket adds a proper eating job that picks up a food item, consumes it, and restores hunger proportional to the item's nutrition. The NeedSatisfactionSystem should prefer eating food items over foraging bushes since food items provide better nutrition (meals give 0.8-1.0 vs foraging's 0.3).

## Plan

### Files to Modify
- `src/renderer/src/simulation/jobs/types.ts` — Add `ConsumeItemStep` type that removes the carried item and restores hunger based on item nutrition
- `src/renderer/src/simulation/jobs/job-factory.ts` — Add `createEatJob()` factory function
- `src/renderer/src/simulation/jobs/job-processor.ts` — Handle `consume_item` step execution
- `src/renderer/src/simulation/behaviors/need-satisfaction-system.ts` — Add food item search logic, prefer food items over bushes
- `src/renderer/src/simulation/skills.ts` — Add `eat` to JOB_SKILL_MAP (no skill, just register type)

### Files to Create
- `src/renderer/src/simulation/behaviors/need-satisfaction-system.test.ts` — Tests for food search preference logic
- `src/renderer/src/simulation/jobs/eat-job.test.ts` — Tests for eat job creation and ConsumeItemStep

### Existing Code to Reuse
- `src/renderer/src/simulation/jobs/job-processor.ts:executePickupItem` — Already handles picking up items from tiles
- `src/renderer/src/simulation/jobs/job-factory.ts:createHaulJob` — Pattern for move → pickup → move → action
- `src/renderer/src/world/registries/item-registry.ts:ITEM_REGISTRY` — Has nutrition values per item type
- `src/renderer/src/simulation/behaviors/need-satisfaction-system.ts:tryForage` — Pattern for searching nearby tiles

### Steps
1. Add `ConsumeItemStep` to job types:
   ```typescript
   export interface ConsumeItemStep {
     type: "consume_item";
     /** Need to restore */
     needId: string;
     status: StepStatus;
   }
   ```
   The step reads the carried item's nutrition from ITEM_REGISTRY and restores that amount of hunger, then deletes the carried item.

2. Add `createEatJob()` to job-factory.ts:
   - Steps: move to food tile → pickup_item → work (60 ticks, ~1s eating) → consume_item
   - Job type: "eat"

3. Handle `consume_item` in job-processor.ts:
   - Get the carried item from `carriedItems`
   - Look up nutrition from `ITEM_REGISTRY[item.type]`
   - Restore hunger by nutrition amount (clamped to 1.0)
   - Delete carried item (item is consumed)

4. Update NeedSatisfactionSystem:
   - Add `tryEat()` method that searches nearby tiles for food items (items with nutrition > 0)
   - Prefer food items over bush foraging: try `tryEat()` first, fall back to `tryForage()`
   - Search within same radius (20 tiles), pick closest food item
   - Skip reserved tiles
   - Add "eat" to the job types that shouldn't be interrupted

5. Write unit tests for ConsumeItemStep and food search logic.

## Acceptance Criteria
- [ ] Colonists automatically eat food items on the ground when hungry
- [ ] Food items are consumed (removed from the world) after eating
- [ ] Hunger is restored by the item's nutrition value from the registry
- [ ] Colonists prefer food items over foraging bushes
- [ ] Eat jobs are not interrupted by non-critical needs
- [ ] ConsumeItemStep properly cleans up carried item state
- [ ] All tests pass, lint:fix and typecheck clean
