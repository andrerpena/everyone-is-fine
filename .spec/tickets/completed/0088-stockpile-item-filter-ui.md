# Stockpile Item Filter UI

**Priority:** medium
**Roadmap Item:** 96
**Created:** 2026-03-12

## Goal
Add a category-based item filter UI to the Zones widget so players can configure which items each stockpile zone accepts.

## Context
The backend filter system already exists (`stockpile-filter.ts`) with `StockpileFilter` (allowedCategories + disallowedTypes), `doesItemPassFilter()`, `CATEGORY_ITEMS`, and `ALL_CATEGORIES`. The zone store has `setStockpileFilter()`. What's missing is the UI to interact with this system.

## Plan

### Files to Modify
- `src/renderer/src/components/widgets/definitions/ZonesWidget.tsx` — Add an expandable filter section for stockpile zones with category checkboxes and per-item toggles

### Existing Code to Reuse
- `src/renderer/src/zones/stockpile-filter.ts:CATEGORY_ITEMS` — maps category → item types
- `src/renderer/src/zones/stockpile-filter.ts:ALL_CATEGORIES` — all available categories
- `src/renderer/src/zones/stockpile-filter.ts:createDefaultFilter` — creates accept-all filter
- `src/renderer/src/zones/zone-store.ts:setStockpileFilter` — persists filter changes
- `src/renderer/src/world/registries/item-registry.ts:ITEM_REGISTRY` — item labels

### Steps
1. Add a "Filter" button/link in the stockpile zone's Config column that expands an inline filter panel
2. Show category checkboxes (resource, food, weapon, apparel, medicine, tool) with human-readable labels
3. Allow expanding a category to see individual item type toggles (for disallowedTypes)
4. Toggling a category adds/removes it from allowedCategories
5. Toggling an individual item adds/removes it from disallowedTypes
6. Call `setStockpileFilter()` on every change

## Acceptance Criteria
- [ ] Stockpile zones show a clickable filter control
- [ ] Category checkboxes toggle whole categories on/off
- [ ] Individual items within a category can be excluded
- [ ] Filter changes persist via zone store
