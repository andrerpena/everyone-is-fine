# Idle Alert Notification

**Priority:** low
**Roadmap Item:** 87
**Created:** 2026-03-11

## Goal
Show a notification when all colonists are idle with no available work, alerting the player that everyone is waiting for tasks.

## Context
GameNotifications already tracks per-character state transitions (mental breaks, hunger). This adds a colony-wide idle detection: when all non-drafted colonists have no active job and are not in a mental break, show a toast. Uses a flag to avoid repeating the alert until at least one colonist becomes busy again.

## Plan

### Files to Modify
- `src/renderer/src/simulation/game-notifications.ts` — Add idle detection logic alongside existing per-character checks

### Existing Code to Reuse
- `src/renderer/src/simulation/game-notifications.ts:GameNotifications` — Add to existing update() method
- `src/renderer/src/simulation/jobs/job-processor.ts:JobProcessor.getJob` — Check if character has active job

### Steps
1. Add JobProcessor dependency to GameNotifications constructor
2. After the per-character loop, check if all characters are idle (no job, not moving, not in mental break, not drafted)
3. Track previous "all idle" state with a boolean flag
4. Show toast only on transition from "not all idle" → "all idle"
5. Reset flag when at least one colonist becomes busy

## Acceptance Criteria
- [ ] Toast appears when all colonists become idle simultaneously
- [ ] Toast does not repeat while colonists remain idle
- [ ] Toast can fire again after colonists work and become idle again
- [ ] Typecheck and lint pass
