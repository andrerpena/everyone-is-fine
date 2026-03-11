# Social Need

**Priority:** medium
**Roadmap Item:** 56
**Created:** 2026-03-11

## Goal
Add a social need that decays over time, with colonists auto-seeking nearby idle colonists to socialize with.

## Context
The needs system supports hunger, energy, mood, comfort, and recreation. Social interaction is the next natural need — colonists who are isolated too long should feel lonely. For now, socializing is a simple job: walk to a nearby idle colonist and chat (work step + restore_need). Future tickets can add conversation content, relationship tracking, etc.

## Plan

### Files to Modify
- `src/renderer/src/simulation/types.ts` — Add `social: number` to CharacterNeeds, default to 1
- `src/renderer/src/simulation/needs/needs-config.ts` — Add social to NeedId and NEED_CONFIGS
- `src/renderer/src/simulation/behaviors/need-satisfaction-system.ts` — Add "socialize" action when social is low; find nearby idle colonist
- `src/renderer/src/simulation/jobs/job-factory.ts` — Add createSocializeJob (move to target colonist + work + restore social)
- `src/renderer/src/agent-api.types.ts` — Add social to needs types
- `src/renderer/src/agent-api.ts` — Add social to spawnCharacter defaults

### Existing Code to Reuse
- `src/renderer/src/simulation/needs/needs-config.ts:NEED_CONFIGS` — follow existing pattern
- `src/renderer/src/simulation/jobs/job-factory.ts:createRelaxJob` — similar structure
- `src/renderer/src/simulation/behaviors/need-satisfaction-system.ts:getMostUrgentAction` — extend with social priority

### Steps
1. Add `social: number` to CharacterNeeds and default to 1
2. Add social to NeedId union and NEED_CONFIGS with slow decay (0.0003/s, ~56 min to empty)
3. Add createSocializeJob to job-factory (move to nearby colonist + work 200 ticks + restore 0.35 social)
4. Extend NeedSatisfactionSystem with "socialize" action (lowest priority, after recreation)
5. Add trySocialize method that finds nearest idle colonist within radius
6. Update agent-api types to include social
7. Write tests
8. Update existing tests that reference CharacterNeeds

## Acceptance Criteria
- [ ] Social need exists with passive decay
- [ ] Colonists auto-seek nearby idle colonists when social drops below threshold
- [ ] Social is restored by the socialize job
- [ ] Agent API exposes social in character info and spawn options
- [ ] Tests pass, lint and typecheck clean
