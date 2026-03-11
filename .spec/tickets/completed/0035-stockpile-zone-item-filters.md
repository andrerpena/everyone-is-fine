# Stockpile Zone Item Filters

**Priority:** high
**Roadmap Item:** 89
**Created:** 2026-03-11

## Goal
Add item filter configuration to stockpile zones so they only accept specific item categories/types.

## Context
The zone framework (ticket 0034) provides the foundation for zones with CRUD operations, tile management, and rendering. Stockpile zones currently exist as a type but have no filter configuration — they're just colored tiles. Adding item filters is the next step toward a functional hauling system where colonists move items to appropriate stockpiles.

## Plan

### Files to Modify
- `src/renderer/src/zones/types.ts` — Add `StockpileFilter` interface to `ZoneData` and define item category constants
- `src/renderer/src/zones/zone-store.ts` — Add `setStockpileFilter` action to update a zone's filter; default new stockpile zones to "accept all"
- `src/renderer/src/zones/index.ts` — Export new types and filter utilities
- `src/renderer/src/agent-api.ts` — Add `zones.setFilter` and `zones.getFilter` methods for agent control
- `src/renderer/src/agent-api.types.ts` — Add filter types to the `zones` API shape

### Files to Create
- `src/renderer/src/zones/stockpile-filter.ts` — Pure utility: `createDefaultFilter()`, `doesItemPassFilter(filter, item)`, `ITEM_CATEGORIES` grouping map
- `src/renderer/src/zones/stockpile-filter.test.ts` — Tests for filter matching logic

### Existing Code to Reuse
- `src/renderer/src/world/types.ts:ItemType` — The item type union (wood, stone, meat, etc.)
- `src/renderer/src/world/types.ts:ItemCategory` — Category grouping (resource, food, tool, etc.)
- `src/renderer/src/world/types.ts:ItemData` — Item data structure to match against filters
- `src/renderer/src/world/registries/item-registry.ts:ITEM_REGISTRY` — Maps ItemType to ItemProperties including category
- `src/renderer/src/zones/zone-store.ts:useZoneStore` — Zone store to extend with filter action

### Steps
1. Create `stockpile-filter.ts` with:
   - `StockpileFilter` type: `{ allowedCategories: Set<ItemCategory>; allowedTypes: Set<ItemType> | null }` — null means "all types within allowed categories"
   - `CATEGORY_ITEMS` map: groups each ItemType under its ItemCategory using ITEM_REGISTRY
   - `createDefaultFilter()`: returns filter that accepts all categories
   - `doesItemPassFilter(filter, itemType)`: checks if an item type passes the filter
2. Add `filter?: StockpileFilter` optional field to `ZoneData` interface
3. Add `setStockpileFilter(zoneId, filter)` action to zone store
4. Default new stockpile zones to `createDefaultFilter()` in `createZone`
5. Add `zones.setFilter(zoneId, config)` and `zones.getFilter(zoneId)` to agent API
6. Write unit tests for filter matching logic
7. Export new types from zones/index.ts

## Acceptance Criteria
- [ ] `StockpileFilter` type defined with category-based and type-based filtering
- [ ] `doesItemPassFilter` correctly matches items against filters
- [ ] New stockpile zones default to accepting all items
- [ ] Zone store has `setStockpileFilter` action
- [ ] Agent API exposes `zones.setFilter` and `zones.getFilter`
- [ ] Unit tests cover: default filter accepts all, category filter, type filter, edge cases
