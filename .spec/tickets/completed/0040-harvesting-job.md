# Harvesting Job

**Priority:** high
**Roadmap Item:** 103
**Created:** 2026-03-11

## Goal
Allow colonists to automatically harvest mature crops from growing zones, completing the farming loop.

## Context
The sowing job (ticket 0039) plants crops in growing zones, and the plant growth system (0038) grows them to maturity. This ticket adds harvesting so colonists gather mature crops, removing the crop from the tile and spawning yield items on the ground.

## Plan

### Files to Modify
- `src/renderer/src/simulation/jobs/types.ts` — Add `HarvestCropStep` interface and include in `JobStep` union
- `src/renderer/src/simulation/jobs/job-factory.ts` — Add `createHarvestJob(characterId, target, cropType)` factory
- `src/renderer/src/simulation/jobs/job-processor.ts` — Handle `harvest_crop` step (remove crop, spawn yield items)
- `src/renderer/src/simulation/skills.ts` — Add `harvest: "plants"` to `JOB_SKILL_MAP`
- `src/renderer/src/simulation/jobs/index.ts` — Export HarvestingSystem, createHarvestJob, HarvestCropStep
- `src/renderer/src/simulation/index.ts` — Export HarvestingSystem
- `src/renderer/src/game-state/store.ts` — Wire HarvestingSystem into tick loop

### Files to Create
- `src/renderer/src/simulation/jobs/harvesting-system.ts` — Auto-assignment system scanning tiles for mature crops

### Existing Code to Reuse
- `src/renderer/src/simulation/jobs/sowing-system.ts` — Pattern for periodic scan + idle colonist assignment
- `src/renderer/src/simulation/plants/crop-registry.ts:CROP_REGISTRY` — yieldType and yieldQuantity per crop
- `src/renderer/src/simulation/jobs/job-processor.ts:executeSpawnItems` — Item spawning pattern
- `src/renderer/src/world/utils/tile-utils.ts:addItemToTile` — Adding items to tiles

### Steps
1. Add `HarvestCropStep` to job types (position, cropType, status)
2. Add `createHarvestJob` factory: move to tile (adjacent) → work (180 ticks) → harvest_crop step
3. Handle `harvest_crop` step in job processor: remove tile.crop, spawn yield items from CROP_REGISTRY
4. Add `harvest: "plants"` to JOB_SKILL_MAP
5. Create HarvestingSystem: every 120 ticks scan all tiles for mature crops, assign harvest jobs to idle colonists
6. Wire HarvestingSystem into store.ts tick loop (after sowing, before idle behavior)
7. Export new symbols

## Acceptance Criteria
- [ ] HarvestCropStep type defined and handled in job processor
- [ ] createHarvestJob creates correct move → work → harvest_crop steps
- [ ] HarvestingSystem auto-assigns harvest jobs to idle colonists for mature crop tiles
- [ ] Harvesting removes crop from tile (sets crop to null)
- [ ] Harvesting spawns correct yield items based on crop type
- [ ] Plants skill affects harvesting work speed
