# Romance System — Core Mechanics

**Priority:** medium
**Roadmap Item:** 151
**Created:** 2026-03-12

## Goal
Allow colonists to form romantic relationships when mutual opinion is high enough, with mood effects and visible relationship labels.

## Context
The relationship system tracks opinion scores (-100 to +100) with labels up to "close friend" (>= 60). Romance is the next natural extension — colonists with very high mutual opinion should develop romantic feelings. This requires a `partner` field on Character, a romance formation check, and mood-affecting thoughts.

## Plan

### Files to Modify
- `src/renderer/src/simulation/types.ts` — Add `partner: EntityId | null` to Character interface and `createCharacter`
- `src/renderer/src/simulation/relationships.ts` — Add "lover" to RelationshipLabel, add ROMANCE_OPINION_THRESHOLD constant
- `src/renderer/src/simulation/social-interaction-system.ts` — Add romance formation check after chat when both opinions are very high
- `src/renderer/src/simulation/thoughts/thought-definitions.ts` — Add `in_relationship` condition-based thought
- `src/renderer/src/simulation/thoughts/thought-system.ts` — Evaluate `in_relationship` thought based on partner field
- `src/renderer/src/components/widgets/definitions/ColonistInfoWidget.tsx` — Show partner name in relationships display

### Files to Create
- `src/renderer/src/simulation/romance.test.ts` — Unit tests for romance formation logic

### Existing Code to Reuse
- `src/renderer/src/simulation/relationships.ts:getOpinion` — Check mutual opinion scores
- `src/renderer/src/simulation/social-interaction-system.ts:triggerChat` — Hook point for romance check
- `src/renderer/src/simulation/thoughts/thought-definitions.ts` — Pattern for adding thoughts

### Steps
1. Add `partner: EntityId | null` to Character interface and initialize as `null` in `createCharacter`.
2. Add `ROMANCE_OPINION_THRESHOLD = 75` constant and `"lover"` label to relationships.ts. Update `getRelationshipLabel` to return "lover" when the pair are partners.
3. Create a pure function `canFormRomance(a: Character, b: Character): boolean` in relationships.ts that checks:
   - Neither has an existing partner
   - Mutual opinion >= ROMANCE_OPINION_THRESHOLD
   - Both are adults (age >= 18, already guaranteed by colonist-generator)
4. In `SocialInteractionSystem.triggerChat`, after adjusting opinions, check if `canFormRomance` is satisfied. If so, set both characters' `partner` field to each other's ID.
5. Add `in_relationship` condition-based thought (+0.08 mood) to thought-definitions.ts. Evaluate in thought-system.ts when `character.partner !== null`.
6. In ColonistInfoWidget, show "Partner: Name" in the relationships section when partner exists.
7. Write unit tests for `canFormRomance` and romance formation.

## Acceptance Criteria
- [ ] Character has `partner: EntityId | null` field
- [ ] Romance forms automatically when mutual opinion >= 75 during ambient chat
- [ ] `in_relationship` thought provides +0.08 mood boost
- [ ] "lover" relationship label shown for partnered colonists
- [ ] Partner name visible in colonist inspector
- [ ] Unit tests pass
- [ ] Quality gate passes (lint:fix + typecheck)
