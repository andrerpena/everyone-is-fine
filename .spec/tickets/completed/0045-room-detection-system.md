# Room Detection System

**Priority:** high
**Roadmap Item:** 122
**Created:** 2026-03-11

## Goal
Implement a system that detects enclosed rooms bounded by walls and doors, enabling downstream systems (temperature, room stats, room roles) to query room membership.

## Context
The construction system (ticket 0044) allows placing walls and doors. The next step toward a full building system is detecting when walls form enclosed rooms. A "room" is a set of passable tiles fully enclosed by walls/doors (using cardinal directions only — diagonal gaps don't count). This is foundational for room stats (item 123), room roles (item 124), indoor temperature (item 141), and beauty/environment needs.

Currently, no room concept exists — only the agent API `buildRoom()` helper that places walls manually.

## Plan

### Files to Create
- `src/renderer/src/simulation/rooms/room-types.ts` — Room interface and types
- `src/renderer/src/simulation/rooms/room-detection-system.ts` — Flood-fill room detection system
- `src/renderer/src/simulation/rooms/room-detection-system.test.ts` — Unit tests
- `src/renderer/src/simulation/rooms/index.ts` — Module exports

### Files to Modify
- `src/renderer/src/simulation/index.ts` — Export room module
- `src/renderer/src/game-state/store.ts` — Wire RoomDetectionSystem into tick loop

### Existing Code to Reuse
- `src/renderer/src/world/utils/tile-utils.ts:getNeighbors4` — Cardinal neighbor lookup for flood-fill
- `src/renderer/src/world/registries/structure-registry.ts:STRUCTURE_REGISTRY` — Check `blocksMovement` to identify room boundaries
- `src/renderer/src/simulation/jobs/construction-system.ts` — Pattern for tick-throttled system with `getWorld` callback

### Steps

1. **Define room types** in `room-types.ts`:
   - `Room` interface: `id: string`, `zLevel: number`, `tiles: Set<string>` (position keys like "x,y"), `isOutdoors: boolean`
   - The "outdoors" room is a special room containing all non-enclosed tiles (useful as a sentinel)

2. **Implement RoomDetectionSystem** in `room-detection-system.ts`:
   - Throttled to run every ~300 ticks (5 seconds at 60 TPS) — rooms change rarely
   - Track a `dirty` flag that's set when structures change (for now, just re-run periodically)
   - Algorithm per z-level:
     a. Create a visited set
     b. For each unvisited passable tile, flood-fill using cardinal neighbors (4-connected)
     c. Stop flood-fill at tiles with `blocksMovement` structures (walls) — doors are passable and part of rooms
     d. If the flood reaches the map edge, mark the room as `isOutdoors: true`
     e. Store each room with a unique ID and its tile set
   - Expose `getRoomAt(x, y, z): Room | null` and `getRooms(z): Room[]` query methods
   - Store rooms in a `Map<number, Room[]>` keyed by z-level

3. **Write tests** covering:
   - Empty open area → single outdoor room
   - Fully enclosed box → one indoor room + outdoor room
   - Two separate enclosed rooms → detected as distinct rooms
   - Door in wall → tiles on both sides of door are in separate rooms (doors connect rooms but are room boundaries... actually no — doors are passable, so if a door connects two enclosed areas, they form one room. Only walls separate rooms.)
   - Actually: a room with a door to the outside → if the door is passable, the flood-fill goes through it and the room connects to outside. We need to decide: should doors be room boundaries?

   **Design decision:** Doors ARE room boundaries. The flood-fill should treat doors as boundaries (like walls) for room detection. This matches RimWorld behavior where doors separate rooms. Check `structure.type` against door types (`door_wood`, `door_metal`, `door_auto`) or use a `isDoor` property.

   Updated tests:
   - Empty map → one outdoor room
   - 3x3 walled room with door → indoor room (tiles inside walls, door excluded) + outdoor room
   - Two adjacent rooms sharing a wall → two distinct indoor rooms
   - Unwalled area → outdoor room
   - Room boundaries respect walls but not other structures (trees, furniture don't split rooms)

4. **Wire into store.ts** — instantiate `RoomDetectionSystem` and call `update()` in tick loop after construction system

5. **Export from simulation/index.ts**

## Acceptance Criteria
- [ ] RoomDetectionSystem detects enclosed rooms via flood-fill on cardinal neighbors
- [ ] Walls and doors are treated as room boundaries
- [ ] Each room has a unique ID, z-level, tile set, and isOutdoors flag
- [ ] Query methods: `getRoomAt(x, y, z)` and `getRooms(z)`
- [ ] System is throttled (runs every ~300 ticks)
- [ ] Unit tests cover basic scenarios (open map, enclosed room, multiple rooms)
- [ ] Wired into game tick loop
- [ ] lint:fix and typecheck pass
