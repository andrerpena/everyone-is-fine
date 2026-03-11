# Autonomous Foraging: Colonists Eat from Berry Bushes

**Priority:** high
**Roadmap Item:** developer-initiated (combines elements of 57, 107, 111)
**Created:** 2026-03-11

## Goal
Hungry colonists autonomously seek berry bushes, forage for a few seconds, and restore their hunger — creating the first self-sustaining gameplay loop.

## Context
Colonists have hunger that decays over time but no way to satisfy it. Berry bushes exist in the world as structures. Food items (berries with nutrition=0.1) are defined in the item registry. This creates the foundation for the food chain.

## Plan

### Files to Create
- `src/renderer/src/simulation/behaviors/forage-behavior.ts` — Autonomous behavior: when hunger drops below threshold, find nearest bush and create forage job

### Files to Modify
- `src/renderer/src/simulation/jobs/job-factory.ts` — Add createForageJob (move → work → restore hunger 0.3)
- `src/renderer/src/simulation/jobs/action-rules.ts` — Add "forage" rule matching bush structures
- `src/renderer/src/simulation/jobs/types.ts` — Add RestoreNeedStep type
- `src/renderer/src/simulation/jobs/job-processor.ts` — Handle RestoreNeedStep execution
- `src/renderer/src/game-state/store.ts` — Instantiate ForageBehavior, add to tick callback
- `src/renderer/src/simulation/index.ts` — Export ForageBehavior

### Steps
1. Add `RestoreNeedStep` to job step types (need id + amount)
2. Handle `restore_need` step in job processor (update entity needs)
3. Create `createForageJob` in job-factory (move adjacent → work 120 ticks → restore hunger 0.3)
4. Add "forage" action rule matching bushes
5. Create ForageBehavior system (check hunger < 0.3, find nearest bush, assign forage job)
6. Integrate into tick callback (after mental break, before idle behavior)
7. Export from simulation index

## Acceptance Criteria
- [ ] Colonists autonomously forage when hunger drops below 0.3
- [ ] Foraging takes ~2 seconds (120 ticks)
- [ ] Hunger is restored by 0.3 after foraging
- [ ] Bush is NOT destroyed (renewable resource)
- [ ] Forage action available via right-click on bush (action rules)
- [ ] Drafted/mental-break colonists don't auto-forage
