# Building Repair System

**Priority:** medium
**Roadmap Item:** 128
**Created:** 2026-03-12

## Goal
Add a repair job that restores damaged structures to full health, using construction skill and requiring no materials.

## Context
Structures have `health` and `maxHealth` fields but there's no way to repair them. The repair job follows the same pattern as other jobs: move → work → effect. A new `repair_structure` step type sets health back to maxHealth.

## Plan

### Files to Modify
- `src/renderer/src/simulation/jobs/types.ts` — Add `RepairStructureStep` type and include in JobStep union
- `src/renderer/src/simulation/jobs/job-processor.ts` — Handle `repair_structure` step (set health to maxHealth)
- `src/renderer/src/simulation/jobs/job-factory.ts` — Add `createRepairJob` function
- `src/renderer/src/simulation/jobs/action-rules.ts` — Add "repair" action rule matching damaged structures
- `src/renderer/src/simulation/jobs/index.ts` — Export createRepairJob

### Existing Code to Reuse
- `src/renderer/src/simulation/jobs/job-processor.ts:executePlaceStructure` — Pattern for modifying tile structure
- `src/renderer/src/world/registries/structure-registry.ts:STRUCTURE_REGISTRY` — maxHealth lookup
- `src/renderer/src/simulation/jobs/action-rules.ts` — Action rule pattern

### Steps
1. Add RepairStructureStep to types.ts
2. Add repair_structure case to job-processor.ts
3. Add createRepairJob to job-factory.ts (work ticks proportional to damage)
4. Add "repair" action rule matching non-natural structures with health < maxHealth
5. Export from index.ts
6. Write tests
7. Run quality gate

## Acceptance Criteria
- [ ] RepairStructureStep type exists in job types
- [ ] Job processor handles repair_structure step
- [ ] createRepairJob creates appropriate job with damage-proportional work
- [ ] Repair action rule matches damaged non-natural structures
- [ ] Quality gate passes
