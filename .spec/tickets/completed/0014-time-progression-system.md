# Time Progression System

**Priority:** high
**Roadmap Item:** 133 (partial — clock advancement only, no visual lighting changes)
**Created:** 2026-03-11

## Goal
Advance the in-game clock each simulation tick so that time of day, day count, seasons, and years progress naturally during gameplay.

## Context
`WorldTime` already exists with `tickCount`, `day`, `hour`, `minute`, `season`, `year` but is never advanced — it stays at the initial values (Day 1, 8:00 AM, Spring, Year 1) forever. This is foundational for day/night rendering, work schedules, seasonal effects, and many other systems.

## Plan

### Files to Create
- `src/renderer/src/simulation/time/time-system.ts` — Pure function `advanceTime(time: WorldTime): WorldTime` that increments the clock by 1 tick
- `src/renderer/src/simulation/time/time-system.test.ts` — Unit tests for time advancement
- `src/renderer/src/simulation/time/index.ts` — Barrel export

### Files to Modify
- `src/renderer/src/game-state/store.ts` — Call `advanceTime` in the tick callback and sync `world.time` to state
- `src/renderer/src/simulation/index.ts` — Export time system from barrel
- `src/renderer/src/agent-api.ts` — Already exposes `world.time` via getter, no changes needed

### Existing Code to Reuse
- `WorldTime` interface in `world/types.ts`
- `TICKS_PER_SECOND` (60) from `simulation-loop.ts`
- Status bar already shows version — could show time too (future ticket)

### Time Scale
- 1 tick = 1 in-game second
- 60 ticks (1 real second) = 1 in-game minute
- 3600 ticks (1 real minute) = 1 in-game hour
- 86400 ticks (~24 real minutes) = 1 in-game day
- 15 days per season, 60 days per year

### Steps
1. Create `advanceTime()` pure function that increments `tickCount` and rolls over minute → hour → day → season → year
2. Create `formatGameTime()` helper for display (e.g., "Day 3, 14:30, Spring Year 1")
3. Write unit tests covering minute rollover, hour rollover, day rollover, season rollover, year rollover
4. Integrate into tick callback in `store.ts`
5. Expose `formatGameTime` for UI consumption

## Acceptance Criteria
- [ ] In-game clock advances each tick (visible via `window.game.world.time`)
- [ ] Minutes roll into hours, hours into days, days into seasons, seasons into years
- [ ] `formatGameTime()` returns human-readable time string
- [ ] Unit tests cover all rollover boundaries
- [ ] Lint and typecheck pass
