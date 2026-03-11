# Hauling Job Type

**Priority:** high
**Roadmap Item:** 81
**Created:** 2026-03-11

## Goal
Add a hauling job that moves items from the ground to matching stockpile zones, with auto-assignment to idle colonists.

## Context
The zone framework (ticket 0034) and stockpile filters (ticket 0035) are in place. Items spawn on the ground from chopping/mining but just sit there. A hauling job lets colonists carry items to designated stockpile zones. This is a core colony sim mechanic.

## Plan

### Files to Modify
- `src/renderer/src/simulation/jobs/types.ts` — Add `PickupItemStep` and `DropItemStep` step types
- `src/renderer/src/simulation/jobs/job-processor.ts` — Handle `pickup_item` and `drop_item` steps (remove item from source tile, add to destination tile)
- `src/renderer/src/simulation/jobs/job-factory.ts` — Add `createHaulJob()` factory function
- `src/renderer/src/simulation/jobs/action-rules.ts` — Add `haul` action rule for tiles with items
- `src/renderer/src/game-state/store.ts` — Add HaulingSystem to tick loop
- `src/renderer/src/simulation/index.ts` — Export HaulingSystem
- `src/renderer/src/agent-api.ts` — Add `haulItem(name, fromPos, toPos)` convenience method

### Files to Create
- `src/renderer/src/simulation/jobs/hauling-system.ts` — Auto-haul system: scans for unhauled items, finds matching stockpile zones, assigns haul jobs to idle colonists

### Existing Code to Reuse
- `src/renderer/src/world/utils/tile-utils.ts:addItemToTile` — Add item to destination
- `src/renderer/src/world/utils/tile-utils.ts:removeItemFromTile` — Remove item from source
- `src/renderer/src/zones/zone-store.ts:useZoneStore` — Find stockpile zones and their tiles
- `src/renderer/src/zones/stockpile-filter.ts:doesItemPassFilter` — Check if stockpile accepts an item
- `src/renderer/src/simulation/jobs/job-processor.ts:JobProcessor` — Existing job execution engine
- `src/renderer/src/simulation/jobs/types.ts:Job` — Job interface pattern

### Steps
1. Add `PickupItemStep` and `DropItemStep` to job step types
2. Handle both new steps in JobProcessor (`executePickupItem` removes item from tile and stores on job, `executeDropItem` adds item to destination tile)
3. Create `createHaulJob(characterId, sourcePos, destPos, itemId)` in job-factory
4. Create `HaulingSystem` class that runs periodically (every 120 ticks):
   - Scan ground tiles for items not already in a stockpile zone
   - For each item, find a stockpile zone that accepts it (via `doesItemPassFilter`)
   - Find an open tile in that stockpile zone
   - Assign a haul job to an idle colonist
5. Wire HaulingSystem into the tick loop in store.ts
6. Add `haul` action rule for agent API tile interactions

## Acceptance Criteria
- [ ] New `pickup_item` and `drop_item` step types work in JobProcessor
- [ ] `createHaulJob` creates proper multi-step job (move → pickup → move → drop)
- [ ] HaulingSystem auto-assigns haul jobs to idle colonists
- [ ] Items are correctly moved from source tile to stockpile tile
- [ ] Only items matching the stockpile filter are hauled to that stockpile
- [ ] Hauled items stack correctly at destination via `addItemToTile`
