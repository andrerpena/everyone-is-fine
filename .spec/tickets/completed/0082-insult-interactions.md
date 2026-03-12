# Insult and Slight Interaction Types

**Priority:** medium
**Roadmap Item:** 157
**Created:** 2026-03-12

## Goal
Add negative social interactions (insults) during ambient chats so opinions can decrease, making breakups and rivalries possible through natural gameplay.

## Context
Currently ambient chats only increase opinion (+1 per chat), so relationships always trend positive and breakups can never trigger organically. Adding a chance for negative interactions (insults/slights) creates realistic social dynamics. The "abrasive" trait should increase insult chance, while "kind" should decrease it.

## Plan

### Files to Modify
- `src/renderer/src/simulation/social-interaction-system.ts` — Add insult logic to `triggerChat`: roll for insult chance based on traits, apply negative opinion delta if insult occurs, add `was_insulted` thought to the target
- `src/renderer/src/simulation/thoughts/thought-definitions.ts` — Add `was_insulted` timed thought (-0.05 mood, 8 hours)

### Existing Code to Reuse
- `src/renderer/src/simulation/social-interaction-system.ts:triggerChat` — Extend with insult branch
- `src/renderer/src/simulation/social-interaction-system.ts:buildChatThoughts` — Pattern for adding timed thoughts
- `src/renderer/src/simulation/relationships.ts:adjustOpinion` — Apply negative opinion delta

### Steps
1. Add constants: `INSULT_BASE_CHANCE = 0.1` (10% of chats become insults), `INSULT_OPINION_DELTA = -3` (opinion penalty per insult).
2. Add `was_insulted` timed thought (-0.05 mood, 8 hours / 28800 seconds) to thought-definitions.ts.
3. In `triggerChat`, after the chat roll succeeds, roll for insult: base 10% chance, +15% if insulter has "abrasive" trait, -8% if insulter has "kind" trait. Each character rolls independently as potential insulter.
4. If an insult occurs: apply `INSULT_OPINION_DELTA` to the target's opinion of the insulter (instead of the normal +1), still restore social need, and add `was_insulted` thought to the target. The insulter's opinion is unchanged (they don't feel bad about insulting).
5. If no insult: proceed with normal positive chat as before.
6. Write unit tests for insult chance calculation.

## Acceptance Criteria
- [ ] ~10% of ambient chats result in an insult
- [ ] Insults reduce target's opinion by 3 (instead of normal +1)
- [ ] `was_insulted` thought (-0.05 mood, 8h) added to insult target
- [ ] "abrasive" trait increases insult chance; "kind" reduces it
- [ ] Unit tests pass
- [ ] Quality gate passes (lint:fix + typecheck)
