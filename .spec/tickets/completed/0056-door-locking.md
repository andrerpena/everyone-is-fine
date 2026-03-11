# Door Locking Mechanism

**Priority:** medium
**Roadmap Item:** 118
**Created:** 2026-03-11

## Goal
Add door lock/unlock functionality so that locked doors block movement and pathfinding.

## Context
Door structures (door_wood, door_metal, door_auto) exist and are buildable, but have no locking mechanism. StructureData already has an `isOpen?: boolean` field. When a door is locked, it should block movement (affecting pathfinding). This completes room isolation — players can lock doors to create secure rooms.

## Plan

### Files to Modify
- `src/renderer/src/world/types.ts` — Add `isLocked?: boolean` to StructureData
- `src/renderer/src/agent-api.ts` — Add `lockDoor` and `unlockDoor` methods
- `src/renderer/src/agent-api.types.ts` — Add type signatures for lock/unlock
- `src/renderer/src/agent-api.ts` — Update tile info to expose door state (isOpen, isLocked)
- `src/renderer/src/agent-api.types.ts` — Add door state to AgentTileInfo

### Existing Code to Reuse
- `src/renderer/src/world/registries/structure-registry.ts:STRUCTURE_REGISTRY` — door category check
- `src/renderer/src/world/types.ts:StructureData` — already has isOpen field
- `src/renderer/src/world/utils/tile-utils.ts:getWorldTileAt` — tile access

### Steps
1. Add `isLocked?: boolean` to StructureData
2. Add lockDoor/unlockDoor agent API methods that toggle isLocked and update tile pathfinding
3. Update AgentTileInfo to expose door state
4. Write tests for lock/unlock behavior

## Acceptance Criteria
- [ ] Doors can be locked via agent API, blocking movement
- [ ] Doors can be unlocked via agent API, allowing movement
- [ ] Pathfinding is updated when door lock state changes
- [ ] Door state (isOpen, isLocked) exposed in tile info
- [ ] Tests pass, lint and typecheck clean
