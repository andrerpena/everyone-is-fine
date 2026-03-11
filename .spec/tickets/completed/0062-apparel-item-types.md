# Apparel/Clothing Item Types

**Priority:** medium
**Roadmap Item:** 73
**Created:** 2026-03-11

## Goal
Add apparel/clothing item types to the item registry so colonists can eventually equip clothing and armor.

## Context
The item system already supports categories including "apparel" in ItemCategory. Weapons and tools have been added (items 71-72). Now we need clothing items that colonists can wear. This cycle focuses on adding the item types and registry entries. Body part slot assignment (head, torso, legs, feet) will be part of the item properties for future equipping logic.

## Plan

### Files to Modify
- `src/renderer/src/world/types.ts` — Add apparel item types to the ItemType union
- `src/renderer/src/world/registries/item-registry.ts` — Add apparel entries with appropriate properties

### Files to Create
- `src/renderer/src/world/registries/apparel-items.test.ts` — Tests for apparel item types

### Existing Code to Reuse
- `src/renderer/src/world/registries/weapon-items.test.ts` — Test pattern for registry validation
- `src/renderer/src/world/registries/item-registry.ts` — Existing registry pattern

### Steps
1. Add apparel item types to ItemType union in types.ts: `shirt`, `pants`, `jacket`, `hat`, `boots`, `armor_leather`, `armor_metal`
2. Add registry entries in item-registry.ts with category "apparel", stack size 1, zero nutrition, zero spoilage
3. Create test file validating all apparel items exist, have correct category, stack size 1, non-perishable, positive base values
4. Run quality gates

## Acceptance Criteria
- [ ] At least 7 apparel item types added to ItemType union
- [ ] All apparel items registered in ITEM_REGISTRY with category "apparel"
- [ ] All apparel items have stack size 1, zero nutrition, zero spoilage
- [ ] Tests verify registry entries
- [ ] Typecheck and lint pass
