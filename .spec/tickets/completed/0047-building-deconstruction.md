# Building Deconstruction and Material Recovery

**Priority:** high
**Roadmap Item:** 125
**Created:** 2026-03-11

## Goal
Allow colonists to deconstruct player-built structures, recovering a portion of the original materials.

## Context
The construction system (ticket 0044) lets colonists build structures from blueprints. Players need the ability to tear down structures they've built — to reclaim materials, redesign layouts, or fix mistakes. All required job step types already exist (move, work, transform_tile, spawn_items). This is purely connecting existing pieces.

## Plan

### Files to Modify
- `src/renderer/src/simulation/jobs/job-factory.ts` — Add createDeconstructJob
- `src/renderer/src/simulation/jobs/action-rules.ts` — Add "deconstruct" action rule
- `src/renderer/src/simulation/skills.ts` — Add deconstruct to JOB_SKILL_MAP
- `src/renderer/src/simulation/jobs/index.ts` — Export createDeconstructJob

### Existing Code to Reuse
- `src/renderer/src/simulation/jobs/job-factory.ts:createBuildJob` — Similar pattern
- `src/renderer/src/world/registries/construction-registry.ts:getConstructionCost` — Material costs for recovery calculation
- `src/renderer/src/world/registries/structure-registry.ts:STRUCTURE_REGISTRY` — Category check (natural vs player-built)
- Job step types: move, work, transform_tile, spawn_items — all already implemented in job-processor.ts

### Steps
1. Add `createDeconstructJob()` to job-factory.ts:
   - Steps: move adjacent → work (half of build time) → spawn recovered items → remove structure
   - Recovery: 75% of original materials (floor division)
   - Work ticks: 50% of construction work ticks
2. Add "deconstruct" action rule to action-rules.ts:
   - Matches tiles with structures whose category is NOT "natural" and NOT "none"
   - Priority 5 (below chop/mine/build, above move)
3. Add `deconstruct: "construction"` to JOB_SKILL_MAP in skills.ts
4. Export createDeconstructJob from jobs/index.ts
5. Write tests for job creation and material recovery

## Acceptance Criteria
- [ ] createDeconstructJob creates correct step sequence
- [ ] Material recovery is 75% of construction cost
- [ ] Work time is 50% of construction time
- [ ] Deconstruct action appears for player-built structures only
- [ ] Construction skill affects deconstruct speed and grants XP
- [ ] lint:fix and typecheck pass
