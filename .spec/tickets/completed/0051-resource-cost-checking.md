# Resource Cost Checking Before Blueprint Placement

**Priority:** medium
**Roadmap Item:** 131
**Created:** 2026-03-11

## Goal
Validate that sufficient materials exist on the map before allowing blueprint placement, preventing players from queuing unbuildable structures.

## Context
The `placeBlueprint` API validates buildability and tile availability but doesn't check whether the required materials (wood, stone, iron, cloth) actually exist on the map. Players can place blueprints for structures they can't build, leading to stuck construction jobs. The construction registry already defines material costs per structure type.

## Plan

### Files to Create
- `src/renderer/src/world/utils/material-counter.ts` — Utility to count available materials across the world

### Files to Modify
- `src/renderer/src/agent-api.ts` — Add material availability check in `placeBlueprint`, and expose `getAvailableMaterials` API method
- `src/renderer/src/agent-api.types.ts` — Add type for getAvailableMaterials

### Existing Code to Reuse
- `src/renderer/src/world/registries/construction-registry.ts:getConstructionCost` — Get material requirements
- `src/renderer/src/world/types.ts:World,ZLevel,ItemType` — World traversal types
- `src/renderer/src/world/utils/tile-utils.ts` — Tile item access patterns

### Steps
1. Create `material-counter.ts` with:
   - `countItemsOnMap(world: World, itemType: ItemType): number` — Iterates all z-levels and tiles, sums quantity of matching items
   - `countAllMaterialsOnMap(world: World): Map<ItemType, number>` — Returns count of all item types
   - `hasSufficientMaterials(world: World, materials: Array<{type: ItemType, quantity: number}>): { sufficient: boolean, missing: Array<{type: ItemType, needed: number, available: number}> }` — Checks if enough materials exist, also accounting for materials already reserved by other pending blueprints
2. In `placeBlueprint`, after existing validations, call `hasSufficientMaterials` with the structure's construction cost. If insufficient, throw a descriptive error listing what's missing.
3. Add `getAvailableMaterials()` to the agent API so agents can check before placing.
4. Write tests for material counting and sufficiency checking.

## Acceptance Criteria
- [ ] countItemsOnMap correctly sums item quantities across all tiles
- [ ] hasSufficientMaterials returns missing materials when insufficient
- [ ] placeBlueprint throws descriptive error when materials unavailable
- [ ] getAvailableMaterials agent API method returns item counts
- [ ] lint:fix and typecheck pass
