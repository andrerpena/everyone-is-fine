# Room Stats Calculation

**Priority:** high
**Roadmap Item:** 123
**Created:** 2026-03-11

## Goal
Calculate stats for detected rooms (size, beauty, wealth, impressiveness) so downstream systems can use them for mood effects and room role assignment.

## Context
Room detection (ticket 0045) identifies enclosed rooms. Now we need to compute meaningful stats for each room. This enables beauty/environment mood thoughts (item 55), room role assignment (item 124), and indoor comfort. We defer cleanliness (needs a filth/contamination system) to a future ticket.

Current gaps: StructureProperties lacks beauty/value fields, and no material registry exists. This ticket adds both.

## Plan

### Files to Create
- `src/renderer/src/simulation/rooms/room-stats.ts` — RoomStats interface and calculation functions
- `src/renderer/src/simulation/rooms/room-stats.test.ts` — Unit tests

### Files to Modify
- `src/renderer/src/world/types.ts` — Add `beauty` and `baseValue` to StructureProperties
- `src/renderer/src/world/registries/structure-registry.ts` — Add beauty/value to all structures
- `src/renderer/src/simulation/rooms/room-types.ts` — Add optional `stats` field to Room
- `src/renderer/src/simulation/rooms/room-detection-system.ts` — Compute stats after detection
- `src/renderer/src/simulation/rooms/index.ts` — Export new types

### Existing Code to Reuse
- `src/renderer/src/simulation/rooms/room-detection-system.ts:detectRoomsForLevel` — Room data
- `src/renderer/src/world/registries/item-registry.ts:ITEM_REGISTRY` — Item baseValue for wealth
- `src/renderer/src/world/registries/structure-registry.ts:STRUCTURE_REGISTRY` — Structure properties
- `src/renderer/src/world/utils/tile-utils.ts:getTileAt` — Tile access

### Steps
1. Add `beauty: number` and `baseValue: number` to `StructureProperties` interface
2. Update `STRUCTURE_REGISTRY` with beauty and value for all structure types
3. Create `room-stats.ts` with:
   - `RoomStats` interface: `{ size, beauty, wealth, impressiveness }`
   - `calculateRoomStats(room, level)` function that iterates room tiles
   - Size = tile count
   - Beauty = average of (structure beauty + floor beauty) per tile, normalized
   - Wealth = sum of (item baseValue * quantity) + structure baseValue for all tiles
   - Impressiveness = composite of size, beauty, and wealth with diminishing returns
4. Add `stats: RoomStats | null` to Room interface
5. Update RoomDetectionSystem to compute stats after detecting rooms
6. Write tests for stat calculations

## Acceptance Criteria
- [ ] StructureProperties has beauty and baseValue fields
- [ ] All structures in STRUCTURE_REGISTRY have beauty/value assignments
- [ ] RoomStats interface with size, beauty, wealth, impressiveness
- [ ] calculateRoomStats function computes all stats from room tiles
- [ ] Stats are computed and stored on Room objects after detection
- [ ] Unit tests cover stat calculations
- [ ] lint:fix and typecheck pass
