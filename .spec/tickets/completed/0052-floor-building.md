# Floor Building System

**Priority:** medium
**Roadmap Item:** 119
**Created:** 2026-03-11

## Goal
Allow colonists to build floors on tiles, affecting movement speed and room beauty.

## Context
Floor types are defined in the type system (FloorType, FloorData) and tiles have a `floor` field, but floors are not buildable and have no properties registry. The construction system handles structures; this ticket extends it to floors. Floors should reduce movement cost (faster travel) and add beauty to rooms.

## Plan

### Files to Create
- `src/renderer/src/world/registries/floor-registry.ts` — Floor properties (movementCost, beauty, baseValue) and construction costs

### Files to Modify
- `src/renderer/src/simulation/jobs/job-factory.ts` — Add createBuildFloorJob
- `src/renderer/src/simulation/jobs/types.ts` — Add PlaceFloorStep type
- `src/renderer/src/simulation/jobs/job-processor.ts` — Handle place_floor step
- `src/renderer/src/simulation/jobs/action-rules.ts` — Add "build_floor" action rule (or expose via agent API only)
- `src/renderer/src/simulation/jobs/index.ts` — Export new factory
- `src/renderer/src/simulation/skills.ts` — Map build_floor to construction skill
- `src/renderer/src/simulation/rooms/room-stats.ts` — Include floor beauty in room beauty calculation
- `src/renderer/src/agent-api.ts` — Add placeFloorBlueprint method
- `src/renderer/src/agent-api.types.ts` — Add type

### Existing Code to Reuse
- `src/renderer/src/world/registries/construction-registry.ts` — Pattern for cost registry
- `src/renderer/src/simulation/jobs/job-factory.ts:createBuildJob` — Similar job pattern
- `src/renderer/src/simulation/jobs/job-processor.ts:executePlaceStructure` — Similar step handler
- `src/renderer/src/world/factories/tile-factory.ts:createFloorData` — Floor instance creation

### Steps
1. Create `floor-registry.ts` with FloorProperties (movementCost, beauty, baseValue) and FloorConstructionCost for each floor type. Movement costs: wood_plank 0.8, stone_tile 0.7, carpet 0.9, dirt_path 0.9, etc.
2. Add `PlaceFloorStep` to job types (position + floorType)
3. Add `createBuildFloorJob` to job-factory (move → work → place_floor)
4. Handle `place_floor` step in job-processor: set tile.floor, update pathfinding movementCost
5. Map `build_floor: "construction"` in JOB_SKILL_MAP
6. Update room-stats.ts: add floor beauty contribution
7. Add `buildFloor` method to agent API
8. Export and wire everything
9. Write tests

## Acceptance Criteria
- [ ] Floor properties registry with beauty, movementCost, baseValue for all floor types
- [ ] Floor construction costs defined (materials + workTicks)
- [ ] createBuildFloorJob creates correct step sequence
- [ ] place_floor step sets tile.floor and updates pathfinding
- [ ] Room beauty includes floor contribution
- [ ] build_floor mapped to construction skill
- [ ] Agent API buildFloor method works
- [ ] lint:fix and typecheck pass
