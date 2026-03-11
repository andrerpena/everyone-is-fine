# Show Item Details in Tile Inspector

**Priority:** medium
**Roadmap Item:** 68
**Created:** 2026-03-11

## Goal
Display actual item names and quantities in the tile inspector instead of just an item count, so players can see what's on a selected tile.

## Context
The TileInspectorWidget currently shows `itemCount: tile.items.length` which tells you "3 items" but not what they are. After chopping trees or mining boulders, items spawn on tiles. Players need to know what items are available. This replaces the numeric count with a human-readable summary string like "Wood x25, Stone x20".

## Plan

### Files to Modify
- `src/renderer/src/schemas/definitions/tile-inspector-schema.ts` — Change `itemCount` from number to `items` as string with readonly renderer
- `src/renderer/src/components/widgets/definitions/TileInspectorWidget.tsx` — Format items array into summary string

### Steps
1. In tile-inspector-schema.ts: replace `itemCount: nu.number()` with `items: nu.string().withMetadata({ label: "Items", renderer: "readonly", editable: false })`
2. Update TileInspectorData interface: change `itemCount: number` to `items: string`
3. Update form layout to keep items in Properties group
4. In TileInspectorWidget.tsx: format `tile.items` into a summary string (e.g., "Wood x25, Stone x20") or "None" if empty

## Acceptance Criteria
- [ ] Tile inspector shows item names and quantities instead of just a count
- [ ] Empty tiles show "None" for items
- [ ] Typecheck and lint pass
