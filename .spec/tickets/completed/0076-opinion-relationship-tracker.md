# Opinion/Relationship Tracker

**Priority:** medium
**Roadmap Item:** 147
**Created:** 2026-03-12

## Goal
Add a per-pair opinion tracking system so colonists develop positive or negative opinions of each other over time.

## Context
The social need and socialize job exist, but there's no relationship tracking between colonist pairs. Adding opinion scores (-100 to +100) enables future features: friendship formation, rivalry, romance, social thoughts, and social fights. This is a foundational data model change.

## Plan

### Files to Modify
- `src/renderer/src/simulation/types.ts` — Add `relationships: Record<EntityId, number>` to the Character interface and `createCharacter` function
- `src/renderer/src/simulation/jobs/job-processor.ts` — After completing a socialize job (restore_need for social), nudge opinion between the two characters by +5
- `src/renderer/src/simulation/index.ts` — Export new relationship helper functions

### Files to Create
- `src/renderer/src/simulation/relationships.ts` — Pure functions: `getOpinion(character, targetId)`, `adjustOpinion(character, targetId, delta)`, `getRelationshipLabel(opinion)` (returns "rival"/"neutral"/"friend"/"close friend" etc.)
- `src/renderer/src/simulation/relationships.test.ts` — Unit tests for opinion adjustment, clamping, and label thresholds

### Existing Code to Reuse
- `src/renderer/src/simulation/types.ts:Character` — Add relationships field
- `src/renderer/src/simulation/jobs/job-processor.ts:executeRestoreNeed` — Pattern for updating character state after a step
- `src/renderer/src/simulation/behaviors/need-satisfaction-system.ts:trySocialize` — Where socialize targets are chosen (could later factor in opinion)

### Steps
1. Create `relationships.ts` with pure helper functions for opinion management.
2. Add `relationships: Record<EntityId, number>` to the `Character` interface in `types.ts`.
3. Initialize `relationships: {}` in `createCharacter`.
4. In `job-processor.ts`, after a socialize job's restore_need step completes, look up the job's target position, find the character there, and adjust both characters' opinions of each other by +5.
5. Export relationship functions from `index.ts`.
6. Write unit tests.

## Acceptance Criteria
- [ ] Character has a `relationships` field mapping EntityId → opinion (-100 to +100)
- [ ] `getOpinion` returns 0 for unknown relationships
- [ ] `adjustOpinion` clamps to [-100, +100]
- [ ] `getRelationshipLabel` returns appropriate labels for opinion ranges
- [ ] Socializing with another colonist nudges opinion positive
- [ ] Unit tests pass for all relationship functions
