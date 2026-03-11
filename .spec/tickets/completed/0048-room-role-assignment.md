# Room Role Assignment

**Priority:** high
**Roadmap Item:** 124
**Created:** 2026-03-11

## Goal
Automatically classify rooms by their role (bedroom, dining room, workshop, etc.) based on their contents.

## Context
Room detection (ticket 0045) and room stats (ticket 0046) are complete. Rooms are identified as enclosed areas bounded by walls/doors, with size, beauty, wealth, and impressiveness calculated. The next step is to assign functional roles based on what furniture/structures are inside. This enables mood thoughts ("slept in a nice bedroom" vs "slept in a barracks"), colonist behavior (seek bedroom for sleep), and UI labeling.

## Plan

### Files to Modify
- `src/renderer/src/simulation/rooms/room-types.ts` — Add RoomRole type and role field to Room interface
- `src/renderer/src/simulation/rooms/room-detection-system.ts` — Compute role after stats for indoor rooms

### Files to Create
- `src/renderer/src/simulation/rooms/room-role.ts` — Role classification logic
- `src/renderer/src/simulation/rooms/room-role.test.ts` — Tests

### Existing Code to Reuse
- `src/renderer/src/simulation/rooms/room-types.ts:Room` — Add role field
- `src/renderer/src/simulation/rooms/room-detection-system.ts:RoomDetectionSystem.update` — Integrate role assignment
- `src/renderer/src/world/registries/structure-registry.ts:STRUCTURE_REGISTRY` — Check structure types in rooms

### Steps
1. Define `RoomRole` type in room-types.ts: `"bedroom" | "barracks" | "dining_room" | "workshop" | "storage" | "prison" | "hospital" | "generic"`. Add `role: RoomRole` to Room interface (default `"generic"`).
2. Create `room-role.ts` with `classifyRoom(room, level)` function:
   - Count structures by type within room tiles
   - Classification rules (first match wins, ordered by specificity):
     - **bedroom**: has 1 bed (exactly 1)
     - **barracks**: has 2+ beds
     - **dining_room**: has table AND chair(s)
     - **workshop**: has workbench
     - **storage**: has chest(s) or shelf/shelves
     - **generic**: fallback for rooms with no distinguishing furniture
   - Outdoor rooms always get `"generic"`
3. Integrate into room-detection-system.ts: call `classifyRoom()` after `calculateRoomStats()` for indoor rooms
4. Export from rooms/index.ts
5. Write tests covering each role classification and edge cases

## Acceptance Criteria
- [ ] RoomRole type defined with bedroom, barracks, dining_room, workshop, storage, generic
- [ ] classifyRoom correctly classifies based on structure contents
- [ ] Bedroom requires exactly 1 bed, barracks requires 2+
- [ ] Dining room requires table + chair
- [ ] Outdoor rooms are always "generic"
- [ ] Role integrated into room detection update loop
- [ ] lint:fix and typecheck pass
