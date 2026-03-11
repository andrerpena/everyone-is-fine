# Need Urgency Priority: Colonists Address Most Critical Need First

**Priority:** high
**Roadmap Item:** 57
**Created:** 2026-03-11

## Goal
Consolidate forage and sleep behaviors into a single NeedSatisfactionSystem that prioritizes the colonist's most critical need, eliminating tick-order bias.

## Context
ForageBehavior and SleepBehavior are nearly identical — same guard checks (drafted, mental break, busy), same pattern (check threshold → assign job). The tick order (forage before sleep) means foraging always wins when both needs are low. A unified system compares need values and addresses the lowest one first, making colonist behavior feel more intelligent.

## Plan

### Files to Create
- `src/renderer/src/simulation/behaviors/need-satisfaction-system.ts` — Unified system: for each idle colonist, find the most critical unsatisfied need, dispatch to appropriate action (forage for hunger, sleep for energy)

### Files to Delete
- `src/renderer/src/simulation/behaviors/forage-behavior.ts` — Replaced by NeedSatisfactionSystem
- `src/renderer/src/simulation/behaviors/sleep-behavior.ts` — Replaced by NeedSatisfactionSystem

### Files to Modify
- `src/renderer/src/game-state/store.ts` — Replace ForageBehavior + SleepBehavior with single NeedSatisfactionSystem
- `src/renderer/src/simulation/index.ts` — Replace ForageBehavior + SleepBehavior exports with NeedSatisfactionSystem
- `src/renderer/src/simulation/behaviors/mental-break-system.ts` — Update food_binge to import createForageJob directly (already does, no change needed)

### Existing Code to Reuse
- `src/renderer/src/simulation/behaviors/forage-behavior.ts` — Bush search logic moves into NeedSatisfactionSystem
- `src/renderer/src/simulation/behaviors/sleep-behavior.ts` — Sleep-in-place logic moves into NeedSatisfactionSystem
- `src/renderer/src/simulation/jobs/job-factory.ts:createForageJob` and `createSleepJob` — Reuse directly

### Steps
1. Create NeedSatisfactionSystem class that:
   - Iterates all characters, applies standard guards (drafted, mental break, has job, moving)
   - Checks hunger and energy against their thresholds (0.3)
   - If both are below threshold, picks the lower value (more urgent)
   - Dispatches to forage (bush search) or sleep (in-place) accordingly
2. Delete forage-behavior.ts and sleep-behavior.ts
3. Update store.ts: replace forageBehavior + sleepBehavior with single needSatisfaction system
4. Update simulation/index.ts exports

## Acceptance Criteria
- [ ] Single NeedSatisfactionSystem replaces ForageBehavior and SleepBehavior
- [ ] When both hunger and energy are low, the most critical (lowest value) is addressed first
- [ ] Foraging still works identically (find bush, move, work, restore hunger)
- [ ] Sleeping still works identically (sleep in place, restore energy)
- [ ] Drafted/mental-break colonists still excluded
- [ ] No duplicate guard check code across behavior systems
