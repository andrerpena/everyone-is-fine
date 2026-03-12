# Ambient Social Interactions

**Priority:** medium
**Roadmap Item:** 146
**Created:** 2026-03-12

## Goal
Make colonists automatically chat when near each other, restoring small amounts of social need and building opinions passively.

## Context
The socialize job exists but only triggers when social need is low. Colonists should also have ambient social interactions — brief chats that happen naturally when two colonists are adjacent. This makes the colony feel more alive and allows relationships to develop organically. The relationship tracker (v0.71.0) provides the opinion adjustment infrastructure.

## Plan

### Files to Create
- `src/renderer/src/simulation/social-interaction-system.ts` — Tick-based system that checks for adjacent colonist pairs and triggers ambient chats
- `src/renderer/src/simulation/social-interaction-system.test.ts` — Unit tests

### Files to Modify
- `src/renderer/src/simulation/index.ts` — Export SocialInteractionSystem
- `src/renderer/src/game-state/store.ts` — Instantiate and wire up the system

### Existing Code to Reuse
- `src/renderer/src/simulation/filth-system.ts` — Tick-based periodic system pattern
- `src/renderer/src/simulation/relationships.ts:adjustOpinion` — For nudging opinions
- `src/renderer/src/simulation/entity-store.ts:getInRadius` — For finding nearby colonists

### Steps
1. Create `SocialInteractionSystem` class following the FilthSystem pattern (check every 120 ticks).
2. On each check, iterate all colonists. For each colonist not on a mental break and not already chatting:
   - Find adjacent colonists (Manhattan distance <= 2) on the same z-level
   - Roll a small chance (~5%) for an ambient chat
   - If chat triggers: restore 0.05 social need to both, adjust opinions by +1 for both
3. Track recently-chatted pairs (cooldown) to avoid spamming.
4. Wire up in store.ts alongside other systems.
5. Write unit tests for the chat probability and cooldown logic.

## Acceptance Criteria
- [ ] SocialInteractionSystem runs periodically and detects adjacent colonists
- [ ] Ambient chats restore small social need (+0.05) to both participants
- [ ] Ambient chats nudge opinions by +1 for both colonists
- [ ] Cooldown prevents the same pair from chatting too frequently
- [ ] Unit tests pass
