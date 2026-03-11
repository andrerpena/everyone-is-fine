# Critical Need Job Interruption

**Priority:** high
**Roadmap Item:** 80
**Created:** 2026-03-11

## Goal
Allow colonists to interrupt their current job when a need reaches critical level, so they can address survival needs (eating, sleeping) instead of dying while chopping a tree.

## Context
Currently, `NeedSatisfactionSystem` skips characters that already have an active job (`if (this.jobProcessor.getJob(character.id)) continue`). This means a colonist chopping a tree (300 ticks / ~5 seconds) or mining a boulder (480 ticks / ~8 seconds) cannot stop to forage even if starving. The need threshold for seeking satisfaction is 0.3, but critical is < 0.2. If a colonist's need reaches critical while working, they should abandon the job.

This is the interruption half of roadmap item 80. Resumption (saving partial progress) is deferred to a future ticket.

## Plan

### Files to Modify
- `src/renderer/src/simulation/behaviors/need-satisfaction-system.ts` — Instead of skipping characters with active jobs entirely, check if any need is critical. If so, cancel the current job and proceed with need satisfaction.

### Existing Code to Reuse
- `src/renderer/src/simulation/needs/needs-config.ts:getNeedThreshold` — Use to check if a need is "critical"
- `src/renderer/src/simulation/jobs/job-processor.ts:cancelJob` — Cancel the active job

### Steps
1. Import `getNeedThreshold` into NeedSatisfactionSystem
2. Before skipping characters with active jobs, check if hunger or energy is at "critical" threshold
3. If critical, cancel the current job via `this.jobProcessor.cancelJob(character.id)` and proceed with need satisfaction
4. Do NOT interrupt for non-critical needs (keep the 0.3 threshold for initial seeking)
5. Do NOT interrupt sleep jobs (colonist is already satisfying a need)

## Acceptance Criteria
- [ ] Colonists interrupt non-essential jobs (chop, mine, wander) when hunger or energy reaches critical (< 0.2)
- [ ] Colonists do NOT interrupt sleep or forage jobs (already satisfying needs)
- [ ] After interruption, colonist immediately seeks to satisfy the critical need
- [ ] Typecheck and lint pass
