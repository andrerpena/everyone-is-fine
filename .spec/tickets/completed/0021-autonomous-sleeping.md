# Autonomous Sleeping: Colonists Rest on the Ground

**Priority:** high
**Roadmap Item:** developer-initiated (addresses energy need having no restore mechanism)
**Created:** 2026-03-11

## Goal
Tired colonists autonomously sleep on the ground to restore energy, creating a second self-sustaining gameplay loop alongside foraging.

## Context
Energy decays at 0.0008/s (~21 min to empty) but there is no way to restore it. Colonists will inevitably become permanently exhausted. The forage system (ticket 0019) established the pattern: behavior system detects low need → creates job → RestoreNeedStep restores the need. Sleeping follows the exact same pattern but with a "work" step representing sleep time instead of bush interaction.

## Plan

### Files to Create
- `src/renderer/src/simulation/behaviors/sleep-behavior.ts` — When energy < 0.3, colonist sleeps in place (no movement needed, just work step + restore energy)

### Files to Modify
- `src/renderer/src/simulation/jobs/job-factory.ts` — Add `createSleepJob` (work 600 ticks ~10s → restore energy 0.5)
- `src/renderer/src/game-state/store.ts` — Instantiate SleepBehavior, add to tick callback (after forageBehavior, before idleBehavior)
- `src/renderer/src/simulation/index.ts` — Export SleepBehavior

### Existing Code to Reuse
- `src/renderer/src/simulation/behaviors/forage-behavior.ts` — Same pattern: check need threshold, skip drafted/mental-break, assign job
- `src/renderer/src/simulation/jobs/job-factory.ts:createForageJob` — Pattern for job with RestoreNeedStep
- `src/renderer/src/simulation/jobs/types.ts:RestoreNeedStep` — Reuse directly for energy restoration

### Steps
1. Create `createSleepJob` in job-factory (no move step — sleep in place; work 600 ticks; restore energy 0.5)
2. Create SleepBehavior system (check energy < 0.3, skip drafted/mental-break/busy; assign sleep job)
3. Integrate into tick callback in store.ts (after forageBehavior, before idleBehavior)
4. Export from simulation/index.ts

## Acceptance Criteria
- [ ] Colonists autonomously sleep when energy drops below 0.3
- [ ] Sleeping takes ~10 seconds (600 ticks)
- [ ] Energy is restored by 0.5 after sleeping
- [ ] Drafted/mental-break colonists don't auto-sleep
- [ ] Sleep job shows as "sleep" type in job progress indicators
- [ ] No movement required — colonist sleeps where they stand
