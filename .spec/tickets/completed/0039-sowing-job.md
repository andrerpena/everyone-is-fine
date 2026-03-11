# Sowing Job

**Priority:** high
**Roadmap Item:** 102
**Created:** 2026-03-11

## Goal
Allow colonists to automatically plant crops on empty tiles within growing zones.

## Context
The plant growth system (ticket 0038) added crop types, growth stages, and tick-based growth. Growing zones exist as a ZoneType but have no functional behavior yet. This ticket adds the sowing job so colonists can plant crops in growing zones, completing the first half of the farming loop (sow → grow → harvest).

## Plan

### Files to Modify
- `src/renderer/src/simulation/jobs/types.ts` — Add `PlantCropStep` interface and include in `JobStep` union
- `src/renderer/src/simulation/jobs/job-factory.ts` — Add `createSowJob(characterId, target, cropType)` factory
- `src/renderer/src/simulation/jobs/job-processor.ts` — Handle `plant_crop` step execution (set tile.crop)
- `src/renderer/src/simulation/skills.ts` — Add `sow: "plants"` to `JOB_SKILL_MAP`
- `src/renderer/src/simulation/jobs/index.ts` — Export SowingSystem and createSowJob
- `src/renderer/src/simulation/index.ts` — Export SowingSystem
- `src/renderer/src/game-state/store.ts` — Wire SowingSystem into tick loop
- `src/renderer/src/agent-api.ts` — Add `setGrowingZoneCrop(zoneId, cropType)` method
- `src/renderer/src/agent-api.types.ts` — Add setGrowingZoneCrop to API shape

### Files to Create
- `src/renderer/src/simulation/jobs/sowing-system.ts` — Auto-assignment system scanning growing zones for empty plantable tiles

### Existing Code to Reuse
- `src/renderer/src/simulation/jobs/hauling-system.ts` — Pattern for periodic scan + idle colonist assignment
- `src/renderer/src/simulation/jobs/job-factory.ts:createChopJob` — Pattern for move → work → action steps
- `src/renderer/src/simulation/jobs/job-processor.ts` — Step execution switch pattern
- `src/renderer/src/zones/zone-store.ts:useZoneStore` — Zone lookup, tile membership
- `src/renderer/src/simulation/plants/crop-registry.ts` — Crop type definitions
- `src/renderer/src/world/registries/terrain-registry.ts` — Terrain fertility check

### Steps
1. Add `PlantCropStep` to job types (position, cropType, status)
2. Add `createSowJob` factory: move to tile → work (150 ticks) → plant_crop step
3. Handle `plant_crop` step in job processor: set tile.crop with CropData (seedling, progress 0)
4. Add `sow: "plants"` to JOB_SKILL_MAP
5. Create SowingSystem: every 120 ticks scan growing zones for empty fertile tiles, assign sow jobs to idle colonists
6. Wire SowingSystem into store.ts tick loop (after hauling, before idle behavior)
7. Add zone crop type configuration: zones need a `cropType` field so the system knows what to plant
8. Add agent API method for setting crop type on growing zones
9. Export new symbols

## Acceptance Criteria
- [ ] PlantCropStep type defined and handled in job processor
- [ ] createSowJob creates correct move → work → plant_crop steps
- [ ] SowingSystem auto-assigns sow jobs to idle colonists for empty growing zone tiles
- [ ] Only fertile terrain (fertility > 0) is plantable
- [ ] Plants skill affects sowing work speed
- [ ] Growing zones track which crop type to plant
- [ ] Agent API can configure crop type on growing zones
