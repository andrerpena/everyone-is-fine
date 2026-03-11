# Construction System Foundation

**Priority:** high
**Roadmap Item:** 114, 115, 116
**Created:** 2026-03-11

## Goal
Enable colonists to build structures (walls, doors, furniture) from blueprints placed on tiles.

## Context
The game has StructureData/StructureProperties and a STRUCTURE_REGISTRY but no way to construct new structures. Players can only interact with naturally generated structures (chop trees, mine boulders). Adding construction unlocks shelter, rooms, and the entire building progression.

## Plan

### Files to Create
- `src/renderer/src/world/registries/construction-registry.ts` — Maps buildable structure types to material costs and work ticks
- `src/renderer/src/simulation/jobs/construction-system.ts` — Auto-assigns build jobs for tiles with blueprints
- `src/renderer/src/simulation/jobs/construction-system.test.ts` — Tests

### Files to Modify
- `src/renderer/src/world/types.ts` — Add `blueprint: StructureData | null` field to Tile
- `src/renderer/src/world/types.ts` — Add DEFAULT_TILE.blueprint = null
- `src/renderer/src/world/factories/tile-factory.ts` — Add blueprint to createTile/cloneTile
- `src/renderer/src/simulation/jobs/types.ts` — Add `PlaceStructureStep` type
- `src/renderer/src/simulation/jobs/job-factory.ts` — Add `createBuildJob()`
- `src/renderer/src/simulation/jobs/job-processor.ts` — Handle `place_structure` step
- `src/renderer/src/simulation/jobs/action-rules.ts` — Add "build" action for tiles with blueprints
- `src/renderer/src/simulation/skills.ts` — Add `build` to JOB_SKILL_MAP (maps to `construction` skill)
- `src/renderer/src/simulation/index.ts` — Export ConstructionSystem
- `src/renderer/src/game-state/store.ts` — Wire ConstructionSystem into tick loop
- `src/renderer/src/agent-api.ts` — Add `placeBlueprint()` and `cancelBlueprint()` methods
- `src/renderer/src/agent-api.types.ts` — Add types

### Steps
1. Add `blueprint` field to Tile and update DEFAULT_TILE, tile-factory
2. Create construction-registry with costs/work for each buildable structure
3. Add `PlaceStructureStep` to job types (sets structure on tile, clears blueprint, updates pathfinding)
4. Add `createBuildJob()`: move adjacent → work → place_structure
5. Handle `place_structure` in job-processor
6. Add "build" action rule matching tiles with blueprints
7. Create ConstructionSystem (scans for blueprints, assigns build jobs to idle colonists)
8. Wire into store.ts tick loop
9. Add agent API methods
10. Tests

## Acceptance Criteria
- [ ] Blueprints can be placed on tiles via agent API
- [ ] Colonists automatically build blueprinted structures
- [ ] Built walls block movement and update pathfinding
- [ ] Construction grants XP to construction skill
- [ ] ConstructionSystem respects reservations
- [ ] All tests pass, lint:fix and typecheck clean
