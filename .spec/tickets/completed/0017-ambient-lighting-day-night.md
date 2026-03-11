# Ambient Lighting: Day/Night Visual Cycle

**Priority:** medium
**Roadmap Item:** 134
**Created:** 2026-03-11

## Goal
Add a semi-transparent color overlay to the world renderer that changes based on the in-game time of day, giving visual feedback that time is passing.

## Context
The time system already tracks hours and provides `getDayPeriod()` returning "night", "dawn", "morning", "afternoon", "evening", "dusk". Currently there is zero visual difference between day and night. Adding ambient lighting makes the world feel alive and provides the foundation for future weather/season visual effects.

## Plan

### Files to Create
- `src/renderer/src/components/pixi/renderers/ambient-lighting.ts` — Pure functions: `getDayPeriodLighting(hour)` returning `{ color, alpha }`, plus a `updateAmbientOverlay(graphics, width, height, hour)` helper

### Files to Modify
- `src/renderer/src/components/pixi/World.tsx` — Add an ambient lighting `Graphics` overlay to the viewport container hierarchy, subscribe to time changes, update each hour

### Existing Code to Reuse
- `src/renderer/src/simulation/time/time-system.ts:getDayPeriod` — determines period from hour
- `src/renderer/src/components/pixi/World.tsx` — container hierarchy pattern, store subscription pattern
- `src/renderer/src/game-state/store.ts` — world.time is advanced each tick

### Steps
1. Create `ambient-lighting.ts` with a `getAmbientLighting(hour: number): { color: number; alpha: number }` function that returns appropriate overlay values per hour (smooth interpolation, not just per-period):
   - Night (22-4): deep blue overlay, alpha ~0.45
   - Dawn (5-6): warm orange-blue transition, alpha ~0.15-0.25
   - Morning (7-11): no overlay (alpha 0)
   - Afternoon (12-16): no overlay (alpha 0)
   - Evening (17-19): warm golden, alpha ~0.05-0.15
   - Dusk (20-21): orange-blue, alpha ~0.2-0.35
   Use hour-based linear interpolation for smooth transitions rather than hard period boundaries.

2. Write unit tests for `getAmbientLighting` covering all periods and transition boundaries.

3. In World.tsx, create an `ambientOverlay` Graphics object. Place it in the container hierarchy after items/structures but before hover/selection/character layers so colonists remain clearly visible.

4. Subscribe to `state.world.time.hour` changes (or `state.simulation.currentTick` throttled). When the hour changes, call `updateAmbientOverlay` to redraw the overlay rectangle with the new color/alpha.

5. Add the overlay to the existing layer system so it can be toggled on/off from the Layers panel.

## Acceptance Criteria
- [ ] World is visually tinted blue at night (hours 22-4)
- [ ] Smooth transitions at dawn and dusk (no jarring color jumps between hours)
- [ ] Daytime (7-16) has no overlay (clear view)
- [ ] Overlay can be toggled via the Layers panel
- [ ] Unit tests pass for getAmbientLighting at all hour values
- [ ] No performance regression (overlay updates only when hour changes)
