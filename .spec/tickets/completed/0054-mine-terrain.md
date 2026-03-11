# Mine Terrain Tiles

**Priority:** medium
**Roadmap Item:** 126
**Created:** 2026-03-11

## Goal
Allow colonists to mine rock terrain tiles, converting them to gravel and yielding stone resources.

## Context
The existing mine job (`createMineJob`) removes boulder *structures* from tiles. Item 126 is about mining rock *terrain* — digging into rock, granite, limestone, marble, or obsidian terrain tiles to transform them into gravel and yield stone (and potentially ore for special rock types). The terrain registry already has `isDiggable` and `hardness` properties ready for this.

## Plan

### Files to Modify
- `src/renderer/src/simulation/jobs/types.ts` — Add `newTerrain` field to `TransformTileStep`
- `src/renderer/src/simulation/jobs/job-processor.ts` — Handle terrain changes in `executeTransformTile`
- `src/renderer/src/simulation/jobs/job-factory.ts` — Add `createMineTerrainJob` function
- `src/renderer/src/simulation/jobs/index.ts` — Export new function
- `src/renderer/src/simulation/jobs/action-rules.ts` — Add action rule for mine_terrain
- `src/renderer/src/agent-api.ts` — Add `mineTerrain` method
- `src/renderer/src/agent-api.types.ts` — Add `mineTerrain` type signature

### Existing Code to Reuse
- `src/renderer/src/world/registries/terrain-registry.ts:TERRAIN_REGISTRY` — hardness affects work time
- `src/renderer/src/simulation/jobs/job-factory.ts:createMineJob` — pattern for mine jobs
- `src/renderer/src/simulation/jobs/types.ts:TransformTileStep` — extend for terrain change
- `src/renderer/src/simulation/skills.ts:JOB_SKILL_MAP` — mine_terrain maps to mining skill

### Steps
1. Add `newTerrain?: TerrainType` to `TransformTileStep`
2. Update `executeTransformTile` to change terrain type when `newTerrain` is set
3. Create `createMineTerrainJob(characterId, target, terrainType)` — work ticks based on hardness, transforms to gravel, spawns stone (marble yields more valuable stone)
4. Add mine_terrain to JOB_SKILL_MAP
5. Add action rule for mine_terrain
6. Add agent API method
7. Write tests

## Acceptance Criteria
- [ ] Rock terrain tiles can be mined, transforming to gravel
- [ ] Work time scales with terrain hardness
- [ ] Mining yields stone items (quantity varies by rock type)
- [ ] Mining skill affects work speed
- [ ] Agent API exposes mineTerrain method
- [ ] Tests pass, lint and typecheck clean
