# Environment Beauty Thoughts

**Priority:** high
**Roadmap Item:** 55
**Created:** 2026-03-11

## Goal
Add mood thoughts based on the beauty of a colonist's current room/environment, connecting the room stats system to colonist mood.

## Context
Room detection (ticket 0045), room stats with beauty calculation (ticket 0046), and room roles (ticket 0048) are complete. Rooms have a `beauty` stat (average structure beauty per tile). The thought system supports condition-based thoughts that are automatically added/removed. This ticket connects these systems so colonists gain mood bonuses in beautiful rooms and penalties in ugly ones.

## Plan

### Files to Modify
- `src/renderer/src/simulation/thoughts/thought-definitions.ts` — Add environment beauty ThoughtIds and definitions
- `src/renderer/src/simulation/thoughts/thought-system.ts` — Extend evaluateConditionThoughts to accept environment context; modify MoodThoughtSystem to accept RoomDetectionSystem and pass room beauty when evaluating

### Existing Code to Reuse
- `src/renderer/src/simulation/rooms/room-detection-system.ts:RoomDetectionSystem.getRoomAt` — Look up room at colonist position
- `src/renderer/src/simulation/rooms/room-types.ts:RoomStats.beauty` — Room beauty value
- `src/renderer/src/simulation/thoughts/thought-system.ts:evaluateConditionThoughts` — Add environment thought evaluation
- `src/renderer/src/game-state/store.ts` — Wire RoomDetectionSystem into MoodThoughtSystem

### Steps
1. Add 5 new ThoughtIds to thought-definitions.ts:
   - `"environment_beautiful"` (beauty ≥ 2.0): moodEffect +0.1, "In a beautiful room"
   - `"environment_pleasant"` (beauty ≥ 1.0): moodEffect +0.05, "Pleasant surroundings"
   - `"environment_ugly"` (beauty ≤ -0.5): moodEffect -0.05, "Ugly environment"
   - `"environment_hideous"` (beauty ≤ -1.5): moodEffect -0.1, "Hideous environment"
   - `"environment_impressive"` (impressiveness ≥ 60): moodEffect +0.05, "Impressive room"
   All condition-based (durationSeconds = 0).

2. Add `EnvironmentContext` interface to thought-system.ts:
   ```typescript
   interface EnvironmentContext {
     roomBeauty: number | null; // null = outdoors or no room
     roomImpressiveness: number | null;
   }
   ```

3. Extend `evaluateConditionThoughts(character, envContext?)` to accept optional environment context and add beauty/impressiveness thoughts based on thresholds.

4. Modify `MoodThoughtSystem` constructor to accept a `getRoomAt` function: `(x, y, z) => Room | null`. In `update()`, look up each character's room and pass environment context to `evaluateConditionThoughts`.

5. Update `store.ts` to pass `roomDetection.getRoomAt.bind(roomDetection)` to MoodThoughtSystem.

6. Write tests for environment thought evaluation.

## Acceptance Criteria
- [ ] 5 environment thoughts defined with appropriate mood effects
- [ ] evaluateConditionThoughts evaluates beauty/impressiveness thresholds
- [ ] MoodThoughtSystem passes room data for each character
- [ ] Colonists in beautiful rooms (beauty ≥ 2.0) get +0.1 mood
- [ ] Colonists in ugly rooms (beauty ≤ -0.5) get -0.05 mood
- [ ] Outdoor colonists (no room) get no environment thoughts
- [ ] lint:fix and typecheck pass
