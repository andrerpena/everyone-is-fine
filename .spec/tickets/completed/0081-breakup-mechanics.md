# Breakup Mechanics and Mood Effects

**Priority:** medium
**Roadmap Item:** 153
**Created:** 2026-03-12

## Goal
Implement automatic breakup when a romantic partner's opinion drops below a threshold, with negative mood effects for both colonists.

## Context
The romance system (v0.74.0) allows colonists to form partnerships when mutual opinion >= 75. However, there's no way for relationships to end. If opinion drops (e.g., through future negative interactions or insults), couples should break up. This completes the romance lifecycle.

## Plan

### Files to Modify
- `src/renderer/src/simulation/relationships.ts` — Add `BREAKUP_OPINION_THRESHOLD` constant and `shouldBreakUp` function
- `src/renderer/src/simulation/social-interaction-system.ts` — Check for breakup conditions during periodic updates (not just during chat)
- `src/renderer/src/simulation/thoughts/thought-definitions.ts` — Add `broke_up` timed thought
- `src/renderer/src/simulation/index.ts` — Export new constants/functions

### Files to Create
- `src/renderer/src/simulation/breakup.test.ts` — Unit tests for breakup logic

### Existing Code to Reuse
- `src/renderer/src/simulation/relationships.ts:getOpinion` — Check partner opinion
- `src/renderer/src/simulation/relationships.ts:canFormRomance` — Pattern for relationship check
- `src/renderer/src/simulation/social-interaction-system.ts` — Hook point for breakup check in update loop

### Steps
1. Add `BREAKUP_OPINION_THRESHOLD = 20` constant to relationships.ts. This is well below the romance threshold (75) to prevent oscillation.
2. Add `shouldBreakUp(a: Character, b: Character): boolean` function that checks if either partner's opinion of the other has dropped below the threshold.
3. Add `broke_up` timed thought (-0.15 mood, 48 hours / 172800 seconds) to thought-definitions.ts.
4. In `SocialInteractionSystem.update()`, add a periodic breakup check (runs on the same interval as social checks). For each character with a partner, check if the partner still exists and if `shouldBreakUp` is true. If so, clear both partners' `partner` field and add the `broke_up` thought.
5. Write unit tests for `shouldBreakUp` function.

## Acceptance Criteria
- [ ] Breakup triggers when either partner's opinion drops below threshold (20)
- [ ] Both colonists' `partner` field is cleared on breakup
- [ ] `broke_up` thought (-0.15 mood) is added to both colonists for 48 hours
- [ ] Breakup also triggers if the partner entity no longer exists (e.g., death)
- [ ] Unit tests pass
- [ ] Quality gate passes (lint:fix + typecheck)
