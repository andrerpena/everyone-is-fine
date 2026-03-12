# Marriage Proposal and Wedding Ceremony

**Priority:** medium
**Roadmap Item:** 152
**Created:** 2026-03-12

## Goal
Add marriage proposals and wedding ceremonies so partnered colonists can get married, providing mood bonuses to the couple and attendees.

## Context
The romance system exists: colonists form partnerships when mutual opinion >= 75, break up when opinion drops below 20. Partners get an "in_relationship" thought (+0.08 mood). Marriage adds a deeper commitment layer with stronger mood effects and a ceremony event that benefits the whole colony.

## Plan

### Files to Modify
- `src/renderer/src/simulation/types.ts` — Add `spouse: EntityId | null` field to Character interface and createCharacter defaults
- `src/renderer/src/simulation/thoughts/thought-definitions.ts` — Add "got_married", "attended_wedding" thought types
- `src/renderer/src/simulation/social-interaction-system.ts` — Add marriage proposal check in the social update loop
- `src/renderer/src/simulation/relationships.ts` — Add MARRIAGE_OPINION_THRESHOLD constant and helper

### Existing Code to Reuse
- `relationships.ts:getOpinion` — check mutual opinion for proposal eligibility
- `social-interaction-system.ts:addTimedThought` — add wedding thoughts
- `social-interaction-system.ts:pairKey` — pair tracking
- `log-store.ts:useLogStore` — log wedding events
- `entity-store.ts:getAll` — find nearby colonists for ceremony attendees

### Steps
1. Add `spouse` field to Character type and createCharacter
2. Add "got_married" and "attended_wedding" thoughts
3. Add MARRIAGE_OPINION_THRESHOLD (85) and minimum partnership ticks constant
4. In SocialInteractionSystem, add a `checkMarriageProposals` method that runs each social check:
   - For each partnered pair: if mutual opinion >= 85 and partnership has lasted >= MIN_PARTNERSHIP_TICKS, roll for proposal
   - On proposal: set spouse on both, add "got_married" thought, find nearby colonists and give them "attended_wedding" thought, log event
5. Add unit tests for proposal eligibility logic

## Acceptance Criteria
- [ ] Partnered colonists with high mutual opinion can get married after a minimum partnership duration
- [ ] Marriage gives a strong mood bonus ("got_married" thought)
- [ ] Nearby colonists get an "attended_wedding" mood boost
- [ ] Wedding events are logged
- [ ] Unit tests cover eligibility logic
