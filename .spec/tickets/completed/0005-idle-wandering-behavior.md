# Idle Wandering Behavior

**Priority:** medium
**Roadmap Item:** 36
**Created:** 2026-03-11

## Goal
Colonists with no tasks should occasionally wander to nearby tiles instead of standing still, making the colony feel alive.

## Context
Currently, idle colonists remain frozen in place. The JobProcessor handles multi-step jobs and the MovementSystem handles path-following, but nothing triggers behavior for idle characters. Adding a simple idle behavior system that periodically picks a random nearby passable tile and creates a move job will bring the colony to life.

## Plan

### Files to Create
- `src/renderer/src/simulation/behaviors/idle-behavior.ts` — IdleBehaviorSystem class that checks idle characters each tick and occasionally assigns wander jobs

### Files to Modify
- `src/renderer/src/simulation/index.ts` — Export the new behavior module
- `src/renderer/src/game-state/store.ts` — Instantiate IdleBehaviorSystem and call its update() in the tick callback

### Existing Code to Reuse
- `src/renderer/src/simulation/jobs/job-processor.ts:assignJob` — To assign wander jobs
- `src/renderer/src/simulation/jobs/types.ts:Job,MoveStep,generateJobId` — Job and step types
- `src/renderer/src/simulation/entity-store.ts` — To iterate idle characters
- `src/renderer/src/world/utils/tile-utils.ts:getWorldTileAt` — To check if target tile is passable

### Steps
1. Create `behaviors/idle-behavior.ts` with:
   - Configurable wander cooldown (e.g., 3-8 seconds between wanders)
   - Track per-character cooldown timers
   - Each tick: check idle characters, if cooldown expired → pick random nearby passable tile (radius 3-5), create a simple move job, assign it
   - Use a simple LCG-based RNG for deterministic wander directions
2. Wire it into the tick callback in store.ts (before jobProcessor.update)
3. Export from simulation/index.ts
4. Run lint:fix + typecheck

## Acceptance Criteria
- [ ] Idle colonists periodically move to random nearby tiles
- [ ] Wander radius is limited (3-5 tiles) so colonists don't drift far
- [ ] Cooldown between wanders prevents constant movement (3-8 second random delay)
- [ ] Wandering is interrupted when a real job is assigned
- [ ] `npm run typecheck` and `npm run lint:fix` pass cleanly
