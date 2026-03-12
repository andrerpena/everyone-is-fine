# Trait-Influenced Chat Opinion Modifiers

**Priority:** medium
**Roadmap Item:** 156
**Created:** 2026-03-12

## Goal
Make personality traits influence the opinion delta during positive chats, so kind colonists build friendships faster and abrasive colonists build them slower.

## Context
Currently all positive chats give exactly +1 opinion regardless of personality. Traits like "kind" and "abrasive" already affect insult chance, but they should also affect the quality of positive conversations. Additionally, shared traits between colonists should give a small opinion bonus (people who are alike get along better).

## Plan

### Files to Modify
- `src/renderer/src/simulation/social-interaction-system.ts` — Add trait-based opinion delta calculation for positive chats

### Files to Create
- `src/renderer/src/simulation/chat-modifiers.test.ts` — Unit tests for the opinion modifier logic

### Existing Code to Reuse
- `src/renderer/src/simulation/social-interaction-system.ts:CHAT_OPINION_DELTA` — Base opinion delta
- `src/renderer/src/simulation/social-interaction-system.ts:getInsultChance` — Pattern for trait-based modifiers
- `src/renderer/src/simulation/traits.ts:TraitId` — Trait type

### Steps
1. Add an exported pure function `getChatOpinionDelta(speaker: Character, listener: Character): number` to social-interaction-system.ts that:
   - Starts with `CHAT_OPINION_DELTA` (1)
   - Adds +1 if speaker has "kind" trait (kind people leave better impressions)
   - Subtracts 1 if speaker has "abrasive" trait (abrasive people leave worse impressions even in non-insult chats), floor at 0
   - Adds +1 if both share any common trait (shared interests / personality compatibility)
2. In `triggerChat`, replace the static `CHAT_OPINION_DELTA` usage for positive chats with `getChatOpinionDelta(a, b)` and `getChatOpinionDelta(b, a)`.
3. Write unit tests for `getChatOpinionDelta`.

## Acceptance Criteria
- [ ] "Kind" speaker gives +1 extra opinion per positive chat
- [ ] "Abrasive" speaker gives -1 opinion per positive chat (min 0)
- [ ] Shared traits between colonists give +1 bonus
- [ ] Unit tests pass
- [ ] Quality gate passes (lint:fix + typecheck)
