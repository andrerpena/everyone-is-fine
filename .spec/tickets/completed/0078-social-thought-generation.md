# Social Thought Generation from Interactions

**Priority:** medium
**Roadmap Item:** 148
**Created:** 2026-03-12

## Goal
Generate mood-affecting thoughts from social interactions so that relationships have tangible feedback in the colonist's mood system.

## Context
The social interaction system (ambient chats) and relationship tracker exist, but there's no connection to the thought/mood system. Colonists chat and opinions change, but there's no visible mood feedback. Adding social thoughts bridges this gap, making social life meaningful for mood.

## Plan

### Files to Modify
- `src/renderer/src/simulation/thoughts/thought-definitions.ts` — Add new social ThoughtIds and ThoughtDefinitions
- `src/renderer/src/simulation/thoughts/thought-system.ts` — Add social condition evaluation in `evaluateConditionThoughts`
- `src/renderer/src/simulation/social-interaction-system.ts` — Add timed "had a chat" thought after ambient chat triggers
- `src/renderer/src/simulation/thoughts/thought-system.test.ts` — Update tests for new social thoughts

### Files to Create
- `src/renderer/src/simulation/thoughts/social-thoughts.test.ts` — Tests for social thought generation

### Existing Code to Reuse
- `src/renderer/src/simulation/relationships.ts:getOpinion` — Check opinion scores for condition-based social thoughts
- `src/renderer/src/simulation/relationships.ts:getRelationshipLabel` — Map opinion to relationship labels
- `src/renderer/src/simulation/thoughts/thought-definitions.ts:ThoughtId` — Extend union with new IDs
- `src/renderer/src/simulation/thoughts/thought-system.ts:evaluateConditionThoughts` — Add social condition checks
- `src/renderer/src/simulation/social-interaction-system.ts:triggerChat` — Add timed thought when chat happens

### Steps

1. Add new ThoughtIds to the union type in `thought-definitions.ts`:
   - `chatted_with_friend` (+0.05 mood, 4 hours) — timed, added when chatting with someone opinion >= 30
   - `chatted_with_rival` (-0.05 mood, 4 hours) — timed, added when chatting with someone opinion <= -60
   - `has_friends` (+0.05 mood, condition-based) — at least one relationship with opinion >= 30
   - `no_friends` (-0.05 mood, condition-based) — no relationships with opinion >= 10 AND at least 2 other colonists exist
   - `has_rival` (-0.03 mood, condition-based) — at least one relationship with opinion <= -60

2. Add ThoughtDefinition entries for each new thought in the THOUGHT_DEFINITIONS array.

3. In `evaluateConditionThoughts`, add social evaluation section:
   - Check `character.relationships` for any opinion >= 30 → add `has_friends`
   - Check if no opinions >= 10 AND entityStore has >= 3 characters → add `no_friends`
   - Check for any opinion <= -60 → add `has_rival`
   - Note: `evaluateConditionThoughts` currently takes `(character, envContext?)`. The relationship checks only need `character.relationships`, which is already available.

4. In `social-interaction-system.ts:triggerChat`, after adjusting opinions, add timed thoughts:
   - If post-adjustment opinion of A toward B is >= 30 → add `chatted_with_friend` to A
   - If post-adjustment opinion of A toward B is <= -60 → add `chatted_with_rival` to A
   - Same logic for B toward A
   - To add a timed thought: push to character's thoughts array with calculated `expiresAtTick`
   - The SocialInteractionSystem needs access to currentTick for expiry calculation. It already tracks `this.currentTick`.
   - Duration conversion: use TICKS_PER_SECOND from simulation-loop to convert seconds to ticks.

5. Write unit tests:
   - Condition-based thoughts: verify `has_friends`, `no_friends`, `has_rival` are correctly evaluated
   - Timed thoughts: verify `chatted_with_friend` / `chatted_with_rival` are added during chat triggers

## Acceptance Criteria
- [ ] 5 new social ThoughtIds defined with appropriate mood effects
- [ ] Condition-based thoughts (`has_friends`, `no_friends`, `has_rival`) evaluated per tick
- [ ] Timed thoughts (`chatted_with_friend`, `chatted_with_rival`) added during ambient chats
- [ ] Unit tests pass for all new social thoughts
- [ ] Quality gate passes (lint:fix + typecheck)
