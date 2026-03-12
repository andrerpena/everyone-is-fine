# Food Poisoning Chance Based on Cooking Skill

**Priority:** medium
**Roadmap Item:** 108
**Created:** 2026-03-12

## Goal
Add a food poisoning mechanic where eating low-quality cooked meals has a chance to cause a timed negative mood thought.

## Context
The game has a thought system with condition-based and timed thoughts, an item quality system, a cooking skill, and a consume_item job step. Food poisoning ties these systems together — meals cooked by unskilled cooks are riskier, giving cooking skill meaningful consequences.

## Plan

### Files to Modify
- `src/renderer/src/simulation/thoughts/thought-definitions.ts` — Add `"food_poisoning"` to ThoughtId union and THOUGHT_DEFINITIONS array (timed, negative mood)
- `src/renderer/src/simulation/jobs/job-processor.ts` — In `executeConsumeItem`, after consuming a food item, roll for food poisoning based on item quality. If triggered, add a timed `food_poisoning` thought to the character.

### Files to Create
- `src/renderer/src/simulation/food-poisoning.ts` — Pure function: `rollFoodPoisoning(itemQuality: number): boolean` and `FOOD_POISONING_DURATION_TICKS` constant. Exported for testability.
- `src/renderer/src/simulation/food-poisoning.test.ts` — Tests for poisoning chance calculation

### Existing Code to Reuse
- `src/renderer/src/simulation/thoughts/thought-definitions.ts:ThoughtId` — Add new ID to union
- `src/renderer/src/simulation/thoughts/thought-system.ts:ActiveThought` — Structure for adding timed thought
- `src/renderer/src/simulation/jobs/job-processor.ts:executeConsumeItem` — Integration point
- `src/renderer/src/world/registries/item-registry.ts:ITEM_REGISTRY` — Look up item category to check if food
- `src/renderer/src/world/types.ts:TICKS_PER_HOUR` — For duration calculation

### Steps
1. Add `"food_poisoning"` to the ThoughtId union in thought-definitions.ts
2. Add a ThoughtDefinition entry: label "Food Poisoning", moodEffect -0.15, durationSeconds 21600 (6 hours)
3. Create food-poisoning.ts with:
   - `FOOD_POISONING_DURATION_TICKS = TICKS_PER_HOUR * 6`
   - `getFoodPoisoningChance(quality: number): number` — higher quality = lower chance. Quality 0 → 40% chance, quality 1 → 0% chance. Linear interpolation.
   - `rollFoodPoisoning(quality: number, random?: number): boolean` — deterministic when random is passed (for testing)
4. In executeConsumeItem, after consuming: if item category is "food" and item has quality field, call rollFoodPoisoning. If true, push a new ActiveThought with food_poisoning thoughtId and computed expiresAtTick.
5. Write tests for getFoodPoisoningChance and rollFoodPoisoning
6. Run quality gate

## Acceptance Criteria
- [ ] `food_poisoning` ThoughtId exists in definitions with negative mood and timed duration
- [ ] Consuming a food item can trigger food poisoning based on quality
- [ ] Higher quality food has lower poisoning chance (quality 1.0 = 0% chance)
- [ ] Food poisoning thought is timed (expires after duration)
- [ ] Non-food items never trigger poisoning
- [ ] Unit tests cover chance calculation and edge cases
