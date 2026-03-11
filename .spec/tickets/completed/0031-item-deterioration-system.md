# Item Deterioration System

**Priority:** medium
**Roadmap Item:** 64
**Created:** 2026-03-11

## Goal
Items left on the ground slowly deteriorate over time, creating urgency to manage resources and building toward the need for stockpiles.

## Context
Items (wood, stone) spawn on tiles when colonists chop trees or mine boulders. ItemData already has an optional `condition` field (0-1). Currently items sit on tiles forever with no degradation. This adds a tick-based system that slowly reduces condition, and removes items when condition reaches 0.

## Plan

### Files to Create
- `src/renderer/src/simulation/items/item-deterioration-system.ts` — Tick-based system that iterates world tiles, degrades item conditions, removes destroyed items

### Files to Modify
- `src/renderer/src/simulation/jobs/job-processor.ts` — Set initial condition=1.0 on spawned items
- `src/renderer/src/game-state/store.ts` — Instantiate and call ItemDeteriorationSystem in tick callback
- `src/renderer/src/simulation/index.ts` — Export new system
- `src/renderer/src/components/widgets/definitions/TileInspectorWidget.tsx` — Show condition in item display
- `src/renderer/src/components/inspector/inspectors/TileInspector.tsx` — Same

### Existing Code to Reuse
- `src/renderer/src/world/utils/tile-utils.ts:getWorldTileAt` — Access tiles
- `src/renderer/src/world/types.ts:ItemData` — condition field already defined

### Steps
1. Set condition=1.0 when spawning items in job-processor executeSpawnItems
2. Create ItemDeteriorationSystem class that runs every N ticks (e.g., 300 = ~5 seconds)
3. For each tile with items, reduce condition by a small amount (e.g., 0.002 per check = ~0 in ~42 minutes)
4. Remove items with condition <= 0
5. Show condition percentage in tile inspector item display (e.g., "wood x25 (85%)")
6. Integrate into store tick callback
7. Add unit tests for the deterioration logic

## Acceptance Criteria
- [ ] Items spawned from jobs start with condition=1.0
- [ ] Items on tiles slowly lose condition over time
- [ ] Items are removed when condition reaches 0
- [ ] Item condition visible in tile inspector
- [ ] Typecheck and lint pass
