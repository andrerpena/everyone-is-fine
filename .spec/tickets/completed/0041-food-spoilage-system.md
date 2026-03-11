# Food Spoilage System

**Priority:** high
**Roadmap Item:** 109
**Created:** 2026-03-11

## Goal
Make food items spoil faster than other items, with different spoilage rates per food type, and temperature affecting spoilage speed.

## Context
The ItemDeteriorationSystem already degrades all ground items at a uniform rate. Harvested crops now spawn food items (vegetables, berries). This ticket makes food spoilage meaningful: raw food spoils faster than cooked meals, and higher temperatures accelerate spoilage.

## Plan

### Files to Modify
- `src/renderer/src/world/types.ts` — Add `spoilageRate` field to `ItemProperties`
- `src/renderer/src/world/registries/item-registry.ts` — Set spoilage rates per item (food fast, non-food 0)
- `src/renderer/src/simulation/items/item-deterioration-system.ts` — Use per-item spoilage rates, scale by temperature
- `src/renderer/src/simulation/items/item-deterioration-system.test.ts` — Update tests for food spoilage behavior

### Existing Code to Reuse
- `src/renderer/src/world/registries/item-registry.ts:ITEM_REGISTRY` — Item property lookups
- `src/renderer/src/simulation/items/item-deterioration-system.ts` — Existing system to enhance

### Steps
1. Add `spoilageRate` (0-1 per check) to `ItemProperties` type
2. Set spoilage rates in ITEM_REGISTRY: raw meat highest (0.01), berries/vegetables medium (0.006), meals lower (0.003), non-food 0 (use base deterioration only)
3. Enhance ItemDeteriorationSystem: food items use spoilageRate instead of base rate; temperature > 25°C doubles spoilage, < 5°C halves it
4. Update existing tests and add new tests for spoilage rates and temperature effects

## Acceptance Criteria
- [ ] ItemProperties has spoilageRate field
- [ ] Food items have higher spoilage rates than non-food items
- [ ] Raw meat spoils fastest, then raw plants, then meals
- [ ] Temperature affects food spoilage speed
- [ ] Non-food items continue deteriorating at the base rate
- [ ] Unit tests cover spoilage rates and temperature effects
