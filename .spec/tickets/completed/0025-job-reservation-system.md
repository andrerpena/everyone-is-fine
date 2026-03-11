# Job Reservation System

**Priority:** high
**Roadmap Item:** 79
**Created:** 2026-03-11

## Goal
Prevent multiple colonists from claiming the same target tile/resource by adding a tile reservation system to the job processor.

## Context
Currently, multiple colonists can target the same bush, tree, or boulder simultaneously because there is no reservation mechanism. The NeedSatisfactionSystem and MentalBreakSystem both scan for bushes independently per colonist, and nothing prevents them from selecting the same tile. This wastes colonist time and looks buggy when multiple colonists converge on the same resource.

## Plan

### Files to Create
- `src/renderer/src/simulation/jobs/reservation-system.ts` — Simple tile reservation tracker (Map from position key to entity ID)

### Files to Modify
- `src/renderer/src/simulation/jobs/job-processor.ts` — Reserve target tile on job assign, release on complete/cancel/fail
- `src/renderer/src/simulation/behaviors/need-satisfaction-system.ts` — Skip reserved bushes when foraging
- `src/renderer/src/simulation/behaviors/mental-break-system.ts` — Skip reserved bushes during food binge
- `src/renderer/src/simulation/jobs/index.ts` — Export ReservationSystem
- `src/renderer/src/simulation/index.ts` — Export ReservationSystem

### Existing Code to Reuse
- `src/renderer/src/simulation/types.ts:positionToKey` — Convert Position3D to string key for the reservation map
- `src/renderer/src/simulation/jobs/job-processor.ts:JobProcessor` — Hook into assignJob/cancelJob/completeJob/failJob

### Steps
1. Create `ReservationSystem` class with reserve(posKey, entityId), release(posKey), isReserved(posKey), isReservedBy(posKey, entityId) methods
2. Instantiate ReservationSystem in JobProcessor constructor
3. In assignJob(): reserve the job's targetPosition
4. In cancelJob(), completeJob(), failJob(): release the reservation
5. Expose a public method `isPositionReserved(pos)` on JobProcessor
6. In NeedSatisfactionSystem.tryForage(): skip tiles where isPositionReserved returns true
7. In MentalBreakSystem.tryFoodBinge(): skip tiles where isPositionReserved returns true
8. Export from index files

## Acceptance Criteria
- [ ] Two colonists never target the same bush/tree/boulder simultaneously
- [ ] Reservations are released when jobs complete, fail, or are cancelled
- [ ] NeedSatisfactionSystem skips reserved tiles when searching for forage targets
- [ ] MentalBreakSystem skips reserved tiles during food binge
- [ ] Typecheck and lint pass
