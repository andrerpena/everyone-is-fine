# Smoothing Job for Rough Stone Floors

**Priority:** medium
**Roadmap Item:** 127
**Created:** 2026-03-12

## Goal
Add a smoothing job that converts exposed rock terrain into a polished smooth stone floor, requiring no materials but work time.

## Context
Mining reveals rough rock terrain. In colony sims, smoothing lets colonists polish natural stone into attractive floors without using materials. The game has a `place_floor` job step and a floor registry. This adds a `stone_smooth` floor type and a smoothing job that matches rock-type terrain without existing floors.

## Plan

### Files to Modify
- `src/renderer/src/world/types.ts` — Add `"stone_smooth"` to FloorType union
- `src/renderer/src/world/registries/floor-registry.ts` — Add `stone_smooth` properties (beauty 2, low movement cost) and NO construction cost (it's free)
- `src/renderer/src/simulation/jobs/job-factory.ts` — Add `createSmoothJob` function (move adjacent → work → place_floor)
- `src/renderer/src/simulation/jobs/action-rules.ts` — Add "smooth" action rule matching rocky terrain without existing floor
- `src/renderer/src/simulation/jobs/index.ts` — Export createSmoothJob

### Existing Code to Reuse
- `src/renderer/src/simulation/jobs/job-factory.ts:createMineTerrainJob` — Work ticks scale with terrain hardness
- `src/renderer/src/simulation/jobs/job-factory.ts:createBuildFloorJob` — Uses place_floor step
- `src/renderer/src/simulation/jobs/action-rules.ts:mine_terrain` — Pattern for matching terrain conditions

### Steps
1. Add `"stone_smooth"` to FloorType union in types.ts
2. Add floor registry entry (beauty 2, movementCost 0.7, baseValue 10)
3. Create `createSmoothJob` in job-factory.ts: move → work (ticks scale with hardness) → place_floor
4. Add "smooth" action rule matching rock/granite/limestone/marble/obsidian terrain with no existing floor and no structure
5. Export from index.ts
6. Run quality gate

## Acceptance Criteria
- [ ] `stone_smooth` floor type exists with good beauty/movement properties
- [ ] Smoothing job works on rock-type terrain tiles
- [ ] No materials required — only work time
- [ ] Work time scales with terrain hardness
- [ ] Action rule only matches appropriate terrain (not soil, sand, water, etc.)
- [ ] Quality gate passes
