# Terrain Movement Speed Modifiers

**Priority:** medium
**Roadmap Item:** 35
**Created:** 2026-03-11

## Goal
Make colonist movement speed vary based on terrain type, so walking on sand/gravel/water is visibly slower than normal terrain.

## Context
The A* pathfinding already weights terrain `movementCost` when computing shortest paths (sand=1.2, gravel=1.3, shallow water=2.0). However, the actual character movement speed is fixed at 2 tiles/sec regardless of terrain. This means terrain only affects route choice, not travel time. Integrating terrain cost into movement speed will make pathfinding costs match actual traversal time.

## Plan

### Files to Modify
- `src/renderer/src/simulation/movement/movement-system.ts` — Accept a `getMovementCost` callback, apply terrain cost to effective speed during movement
- `src/renderer/src/game-state/store.ts` — Pass a `getMovementCost` function when constructing MovementSystem

### Existing Code to Reuse
- `src/renderer/src/game-state/store.ts:599` — Pattern for passing world accessor: `() => useGameStore.getState().world`
- `src/renderer/src/simulation/pathfinding/astar.ts:getMovementCostAt` — Pattern for looking up tile movement cost from world data

### Steps
1. Add a `getMovementCost: (position: Position3D) => number` callback parameter to the `MovementSystem` constructor
2. In `updateCharacterMovement`, look up the movement cost of the **next waypoint** tile and divide speed by it: `effectiveSpeed = speed / movementCost`
3. In `store.ts`, create a helper that looks up `tile.pathfinding.movementCost` from the world and pass it to `new MovementSystem(entityStore, getMovementCost)`
4. Run lint:fix + typecheck

## Acceptance Criteria
- [ ] Characters move slower on sand, gravel, and shallow water tiles
- [ ] Characters move at normal speed on soil and rock tiles
- [ ] Movement cost lookup uses world tile data (not hardcoded values)
- [ ] `npm run typecheck` and `npm run lint:fix` pass cleanly
