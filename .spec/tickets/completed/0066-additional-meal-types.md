# Additional Meal Types (Lavish Meal & Nutrient Paste)

**Priority:** medium
**Roadmap Item:** 106
**Created:** 2026-03-11

## Goal
Add lavish meal and nutrient paste item types to complete the meal tier system.

## Context
The item registry has `meal_simple` (nutrition 0.8, value 5) and `meal_fine` (nutrition 1.0, value 10). The roadmap calls for lavish meals (highest quality, most ingredients) and nutrient paste (efficient but low quality). This completes the food progression: nutrient paste < simple meal < fine meal < lavish meal.

## Plan

### Files to Modify
- `src/renderer/src/world/types.ts` — Add `meal_lavish` and `nutrient_paste` to ItemType union
- `src/renderer/src/world/registries/item-registry.ts` — Add registry entries with appropriate properties

### Files to Create
- `src/renderer/src/world/registries/meal-items.test.ts` — Tests for all meal item types

### Steps
1. Add `meal_lavish` and `nutrient_paste` to the ItemType union in types.ts
2. Add registry entries: nutrient_paste (low value, high nutrition, no spoilage) and meal_lavish (high value, max nutrition, slow spoilage)
3. Write tests verifying all 4 meal types exist, have correct category, nutrition ordering, and value ordering

## Acceptance Criteria
- [ ] `meal_lavish` and `nutrient_paste` added to ItemType
- [ ] Registry entries with appropriate nutrition, value, and spoilage
- [ ] Nutrition ordering: nutrient_paste < meal_simple < meal_fine < meal_lavish
- [ ] Value ordering: nutrient_paste < meal_simple < meal_fine < meal_lavish
- [ ] Tests verify meal type properties
- [ ] Typecheck and lint pass
