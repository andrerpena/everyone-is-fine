# Social Fight System

**Priority:** medium
**Roadmap Item:** 155
**Created:** 2026-03-12

## Goal
Add social fights where colonists with very low mutual opinions may physically fight, causing mood penalties and opinion drops.

## Context
The social interaction system already handles ambient chats, insults, opinion tracking, and relationship labels. Colonists can develop "rival" status (opinion <= -60). Currently there's no consequence beyond mood thoughts. Adding fights gives rivalry real weight.

## Plan

### Files to Modify
- `src/renderer/src/simulation/thoughts/thought-definitions.ts` — Add "social_fight" thought type
- `src/renderer/src/simulation/social-interaction-system.ts` — Add fight check during social interaction updates, triggered when both colonists have very negative opinions of each other

### Existing Code to Reuse
- `social-interaction-system.ts:pairKey` — pair deduplication
- `social-interaction-system.ts:addTimedThought` — adding thoughts with expiry
- `relationships.ts:getOpinion` — checking opinion levels
- `relationships.ts:adjustOpinion` — lowering opinion after fight
- `log-store.ts:useLogStore` — logging fight events

### Steps
1. Add "social_fight" to ThoughtId union and THOUGHT_DEFINITIONS array
2. Add fight constants (FIGHT_OPINION_THRESHOLD, FIGHT_CHANCE, FIGHT_OPINION_DELTA, FIGHT_COOLDOWN)
3. Add a `checkFights` method to SocialInteractionSystem that runs each social check interval
4. When two nearby colonists both have opinion <= threshold, roll for fight
5. On fight: drop opinions further, add "social_fight" thought to both, log the event
6. Add unit tests for the fight probability and opinion delta logic

## Acceptance Criteria
- [ ] Colonists with very low mutual opinions can trigger social fights
- [ ] Fights cause mood penalty and opinion drop for both parties
- [ ] Fight events are logged
- [ ] Cooldown prevents repeated fights between the same pair
- [ ] Unit tests cover fight logic
