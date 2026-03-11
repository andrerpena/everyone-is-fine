# Mood Thought System

**Priority:** medium
**Roadmap Item:** 50
**Created:** 2026-03-11

## Goal
Add a thought system where colonists accumulate positive and negative thoughts with expiry timers, and mood is computed from thoughts rather than passively decaying.

## Context
Currently mood is just another need that decays at 0.0005/sec — it has no connection to what's happening to the colonist. A thought system makes mood meaningful: hungry colonists get negative thoughts, well-rested colonists get positive ones, and trait-based thoughts add personality. This is foundational for mental breaks (item 51) and makes the simulation feel alive.

## Plan

### Files to Create
- `src/renderer/src/simulation/thoughts/thought-definitions.ts` — Thought type registry with mood effects and durations
- `src/renderer/src/simulation/thoughts/thought-system.ts` — MoodThoughtSystem that evaluates conditions and manages active thoughts per character
- `src/renderer/src/simulation/thoughts/index.ts` — Barrel exports

### Files to Modify
- `src/renderer/src/simulation/types.ts` — Add `thoughts` array to Character interface, remove mood from passive decay
- `src/renderer/src/simulation/needs/needs-system.ts` — Stop decaying mood passively (mood will be computed from thoughts)
- `src/renderer/src/simulation/needs/needs-config.ts` — Remove mood from NEED_CONFIGS (or keep but set decay to 0)
- `src/renderer/src/game-state/store.ts` — Add MoodThoughtSystem to tick callback after NeedsSystem
- `src/renderer/src/simulation/index.ts` — Export thought types and system
- `src/renderer/src/schemas/definitions/colonist-inspector-schema.ts` — Add thoughts display field
- `src/renderer/src/components/widgets/definitions/ColonistInfoWidget.tsx` — Pass thoughts to inspector
- `src/renderer/src/simulation/entity-store.ts` — Handle thoughts in mergeCharacter

### Existing Code to Reuse
- `src/renderer/src/simulation/needs/needs-config.ts:getNeedThreshold` — Use to check hunger/energy thresholds for thought triggers
- `src/renderer/src/simulation/traits.ts:CharacterTraits` — Check traits for trait-based thoughts (e.g., optimist baseline)
- `src/renderer/src/simulation/entity-store.ts:EntityStore` — Character iteration pattern

### Steps
1. Create `thought-definitions.ts`:
   - `ThoughtId` union type for ~10 starter thoughts
   - `ThoughtDefinition` interface: id, label, description, moodEffect (-1 to +1), durationSeconds (0 = permanent while condition holds), stackable boolean
   - `THOUGHT_DEFINITIONS` registry
   - Starter thoughts: "hungry" (-0.1), "starving" (-0.3), "well_rested" (+0.05), "exhausted" (-0.15), "optimist_baseline" (+0.1), "pessimist_baseline" (-0.1), "ate_recently" (+0.05), "neurotic_anxiety" (-0.08)

2. Create `thought-system.ts`:
   - `ActiveThought` interface: thoughtId, addedAtTick, expiresAtTick (null = condition-based)
   - `MoodThoughtSystem` class with `update(currentTick: number)`:
     - For each character, evaluate conditions and add/remove thoughts
     - Remove expired thoughts
     - Compute mood as: clamp(0.5 + sum of active thought mood effects, 0, 1)
     - Base mood is 0.5 (neutral), thoughts shift it up/down
   - Condition evaluators: check hunger threshold, energy threshold, traits

3. Add `thoughts: ActiveThought[]` to Character, default to `[]`

4. Remove mood from passive decay in NeedsSystem (keep hunger and energy decaying)

5. Wire MoodThoughtSystem into tick callback after NeedsSystem

6. Add thoughts display to colonist inspector (show active thought labels)

7. Write unit tests for thought evaluation and mood computation

8. Run lint:fix + typecheck

## Acceptance Criteria
- [ ] `ThoughtDefinition` registry with ~10 starter thoughts
- [ ] `MoodThoughtSystem` evaluates conditions and manages thoughts per character
- [ ] Mood computed from base 0.5 + thought effects, clamped to [0, 1]
- [ ] Expired thoughts are removed automatically
- [ ] Hunger/energy thresholds trigger appropriate thoughts
- [ ] Trait-based thoughts applied (optimist, pessimist, neurotic)
- [ ] Mood no longer decays passively
- [ ] Colonist inspector shows active thoughts
- [ ] Unit tests for mood computation and thought lifecycle
- [ ] `npm run typecheck` and `npm run lint:fix` pass cleanly
