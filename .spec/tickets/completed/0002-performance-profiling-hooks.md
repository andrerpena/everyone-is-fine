# Performance Profiling Hooks for Game Loop

**Priority:** medium
**Roadmap Item:** 9
**Created:** 2026-03-11

## Goal
Add per-system timing measurement to the game loop and expose entity count + tick rate metrics, so the existing performance widget can display a full profiling breakdown.

## Context
FPS tracking already exists via `performance-store.ts` (circular buffer, Zustand store) and is displayed in `PerformanceWidget.tsx` as a line chart. However, there's no visibility into how long each system takes per tick, how many entities exist, or the actual tick rate. This data is essential for identifying bottlenecks as the simulation grows more complex.

## Plan

### Files to Modify
- `src/renderer/src/lib/performance-store.ts` — Extend store with per-system timing data, entity count, and TPS (ticks per second) tracking
- `src/renderer/src/game-state/store.ts` — Wrap each system's `update()` call in `performance.now()` timing and push results to the performance store
- `src/renderer/src/components/widgets/definitions/PerformanceWidget.tsx` — Add sections showing entity count, TPS, and per-system timing breakdown below the existing FPS chart

### Existing Code to Reuse
- `src/renderer/src/lib/performance-store.ts` — Circular buffer pattern for FPS can be reused for TPS tracking
- `src/renderer/src/simulation/entity-store.ts` — `.size` property for entity count
- `src/renderer/src/game-state/store.ts:607-629` — Tick callback where system updates happen (timing hooks go here)
- `src/renderer/src/components/widgets/definitions/PerformanceWidget.tsx` — Existing chart infrastructure

### Steps
1. **Extend performance store types**: Add `SystemTimings` type (map of system name → milliseconds), `entityCount: number`, `tps: number` (ticks per second), and a `pushTickMetrics` action to the store
2. **Add TPS tracking**: Implement a simple TPS counter in the store — count ticks in a rolling 1-second window
3. **Instrument the tick callback**: In `store.ts`, wrap `jobProcessor.update()` and `movementSystem.update()` calls with `performance.now()` before/after, plus measure the state sync step. Push all timings to the performance store via `pushTickMetrics`
4. **Throttle metric updates**: Only push metrics to the store every ~500ms (matching FPS update cadence) to avoid unnecessary React re-renders
5. **Update PerformanceWidget**: Add a summary row at top showing current FPS, TPS, and entity count. Add a simple bar/table below the chart showing per-system timing (system name + ms per tick)
6. **Remove debug console.info**: Clean up the `console.info` call in PerformanceWidget that logs on every render
7. **Run quality gate**: `npm run lint:fix && npm run typecheck`

## Acceptance Criteria
- [ ] Performance store tracks per-system timing (jobProcessor, movementSystem, stateSync)
- [ ] Performance store tracks entity count from entity store
- [ ] Performance store tracks TPS (ticks per second)
- [ ] Tick callback instruments each system with performance.now() timing
- [ ] PerformanceWidget displays entity count, TPS, and per-system timing breakdown
- [ ] Metrics are throttled to avoid excessive re-renders
- [ ] lint:fix and typecheck pass cleanly
