# Mental Break: Sad Wander

**Priority:** high
**Roadmap Item:** 51, 52
**Created:** 2026-03-11

## Goal
When a colonist's mood drops to critical (< 0.2), they enter a "sad wander" mental break — ignoring commands and wandering aimlessly until mood recovers above the threshold.

## Context
The mood thought system (ticket 0011) computes mood from active thoughts, but nothing happens when mood reaches critical. Mental breaks add consequences to low mood and drama to gameplay. "Sad wander" is the simplest break type — the colonist just wanders randomly, unresponsive to player commands. This is the foundation for more complex break types later.

## Plan

### Files to Create
- `src/renderer/src/simulation/behaviors/mental-break-system.ts` — System that checks for critical mood and triggers/ends mental breaks
- `src/renderer/src/simulation/behaviors/mental-break-system.test.ts` — Unit tests

### Files to Modify
- `src/renderer/src/simulation/types.ts` — Add `mentalBreak` field to Character interface
- `src/renderer/src/simulation/entity-store.ts` — Handle merging of `mentalBreak` field
- `src/renderer/src/simulation/behaviors/idle-behavior.ts` — Skip characters in mental break (they get their own wander behavior)
- `src/renderer/src/game-state/store.ts` — Add mental break system to tick callback (after mood, before idle behavior)
- `src/renderer/src/simulation/index.ts` — Export mental break system
- `src/renderer/src/simulation/thoughts/thought-definitions.ts` — Add "mental_break_sad_wander" thought
- `src/renderer/src/agent-api.types.ts` — Add mentalBreak to AgentCharacterInfo
- `src/renderer/src/agent-api.ts` — Expose mentalBreak in toAgentCharacter

### Existing Code to Reuse
- `IdleBehaviorSystem` — Pattern for wander behavior (random destination, cooldown)
- `getNeedThreshold()` — Already defines "critical" threshold (< 0.2)
- `MoodThoughtSystem` — Already computes mood each tick
- `jobProcessor.cancelJob()` — Cancel active jobs when break starts
- `entityStore.update()` — Update character state

### Design
- Add `mentalBreak: { type: "sad_wander"; startedAtTick: number } | null` to Character
- Mental break triggers when `needs.mood < 0.2` and `mentalBreak === null`
- Mental break ends when `needs.mood >= 0.3` (hysteresis to prevent flickering)
- During break: cancel active jobs/commands, assign random wander destinations (same as idle but ignores player input)
- Idle behavior skips characters with `mentalBreak !== null`
- Add a thought "mental_break_sad_wander" (moodEffect: -0.05, duration: 0) as a condition-based thought

### Steps
1. Add `mentalBreak` field to Character type and createCharacter defaults
2. Add merge handling in entity-store
3. Add "mental_break_sad_wander" thought definition
4. Create MentalBreakSystem class that:
   - Checks mood each tick
   - Triggers break when mood < 0.2 (cancel jobs, set mentalBreak state)
   - Ends break when mood >= 0.3
   - Assigns wander jobs during break (reuse idle wander pattern)
5. Skip mental break characters in IdleBehaviorSystem
6. Integrate into tick callback
7. Expose in agent API
8. Write unit tests for trigger/end logic

## Acceptance Criteria
- [ ] Colonist enters sad wander when mood drops below 0.2
- [ ] Colonist exits sad wander when mood recovers above 0.3
- [ ] During break, colonist wanders randomly and ignores player commands
- [ ] Active jobs are cancelled when break starts
- [ ] "mental_break_sad_wander" thought appears during break
- [ ] `window.game.characters[0].mentalBreak` exposes break state
- [ ] Unit tests cover trigger, end, and hysteresis logic
- [ ] Lint and typecheck pass
