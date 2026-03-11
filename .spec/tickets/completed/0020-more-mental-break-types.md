# More Mental Break Types: Food Binge & Hide in Room

**Priority:** medium
**Roadmap Item:** 52
**Created:** 2026-03-11

## Goal
Add "food binge" and "daze" mental break types alongside existing "sad wander", giving colonists varied reactions to critical mood.

## Context
The mental break system (ticket 0016) currently supports only `sad_wander`. Colonists always react the same way to low mood. Adding variety makes the simulation more interesting and creates emergent storytelling. Since rooms/buildings don't exist yet, "hide in room" is replaced with "daze" (colonist stands still, unresponsive). "Food binge" makes the colonist seek food obsessively — reusing the existing forage system.

## Plan

### Files to Modify
- `src/renderer/src/simulation/types.ts` — Extend `MentalBreakType` union with `"food_binge" | "daze"`
- `src/renderer/src/simulation/behaviors/mental-break-system.ts` — Randomly select break type on trigger; add `updateFoodBinge` (seek bush + forage job, repeat) and `updateDaze` (do nothing, just stand still) behaviors
- `src/renderer/src/simulation/thoughts/thought-definitions.ts` — Add `ThoughtId` entries and definitions for `mental_break_food_binge` and `mental_break_daze`
- `src/renderer/src/simulation/thoughts/thought-system.ts` — Add condition checks for new break types in `evaluateConditionThoughts`
- `src/renderer/src/agent-api.types.ts` — No changes needed (mentalBreak.type is already `string`)

### Existing Code to Reuse
- `src/renderer/src/simulation/behaviors/mental-break-system.ts:tryBreakWander` — Pattern for sad_wander behavior during break
- `src/renderer/src/simulation/behaviors/forage-behavior.ts` — Bush search logic to reuse for food_binge
- `src/renderer/src/simulation/jobs/job-factory.ts:createForageJob` — Reuse for food_binge foraging

### Steps
1. Extend `MentalBreakType` in types.ts with `"food_binge" | "daze"`
2. Add thought definitions for the two new break types in thought-definitions.ts
3. Add condition checks in thought-system.ts for the new break types
4. In mental-break-system.ts:
   - Add `selectBreakType()` method using deterministic RNG to pick between sad_wander (50%), food_binge (30%), daze (20%)
   - Modify `triggerBreak()` to call `selectBreakType()` instead of hardcoding sad_wander
   - Add `updateFoodBingeBehavior()` — similar to forage behavior: find nearest bush, assign forage job, repeat on cooldown (colonist eats compulsively)
   - Add `updateDazeBehavior()` — no-op (colonist just stands still, already handled by doing nothing)
   - Modify `updateBreakBehavior()` to dispatch to the right handler based on break type
5. Export any new constants from simulation/index.ts if needed

## Acceptance Criteria
- [ ] Three mental break types exist: sad_wander, food_binge, daze
- [ ] Break type is randomly selected when a break triggers
- [ ] Food binge causes colonist to repeatedly seek and eat from bushes
- [ ] Daze causes colonist to stand still (no wandering, no jobs)
- [ ] Each break type has its own thought with appropriate mood effect
- [ ] All breaks still end when mood >= 0.3 (recovery threshold)
- [ ] Drafted colonists are still immune to mental breaks
