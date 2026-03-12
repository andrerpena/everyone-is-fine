# Auto-Roofing System for Enclosed Rooms

**Priority:** medium
**Roadmap Item:** 132
**Created:** 2026-03-12

## Goal
Add automatic roof detection to enclosed rooms so the game can distinguish roofed vs unroofed tiles, enabling future indoor temperature, rain protection, and visual indicators.

## Context
The room detection system already identifies indoor rooms (enclosed by walls, not touching map edges). Roofing is a natural extension: indoor rooms are automatically roofed. This is a prerequisite for indoor temperature (item 141), rain/snow not affecting indoor tiles, and solar-dependent systems. Scope is limited to auto-roofing — no manual roof placement or roof collapse in this ticket.

## Plan

### Files to Modify
- `src/renderer/src/simulation/rooms/room-types.ts` — Add `isRoofed: boolean` to `Room` interface
- `src/renderer/src/simulation/rooms/room-detection-system.ts` — Set `isRoofed` based on `!isOutdoors` when creating rooms
- `src/renderer/src/simulation/rooms/room-detection-system.test.ts` — Add tests verifying isRoofed flag
- `src/renderer/src/agent-api.ts` — Expose `isRoofed(x, y)` query in agent API
- `src/renderer/src/agent-api.types.ts` — Add `isRoofed` to AgentTileInfo or add new method type

### Existing Code to Reuse
- `src/renderer/src/simulation/rooms/room-detection-system.ts:RoomDetectionSystem` — Has `getRoomAt(x,y,z)` returning Room with isOutdoors
- `src/renderer/src/simulation/rooms/room-types.ts:Room` — Room interface to extend

### Steps
1. Add `isRoofed: boolean` to `Room` interface
2. Set `isRoofed: !touchesEdge` in `detectRoomsForLevel`
3. Update existing tests to verify `isRoofed` on detected rooms
4. Add `isRoofed` field to agent API tile info (derive from room lookup)
5. Expose room detection system reference so agent API can query it

## Acceptance Criteria
- [ ] Indoor rooms have `isRoofed: true`, outdoor rooms have `isRoofed: false`
- [ ] Agent API tile info includes `isRoofed` boolean
- [ ] Existing room detection tests updated and passing
- [ ] TypeScript compiles cleanly
- [ ] Lint passes
