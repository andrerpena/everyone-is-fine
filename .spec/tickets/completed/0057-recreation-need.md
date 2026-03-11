# Recreation Need

**Priority:** medium
**Roadmap Item:** 54
**Created:** 2026-03-11

## Goal
Add a recreation need that decays over time, with colonists auto-seeking relaxation when it drops low.

## Context
The needs system supports hunger, energy, mood, and comfort. Recreation is a natural addition — colonists who work nonstop get stressed. For now, recreation is restored by a simple "relax" job (wander to a nearby spot and idle). Future tickets can add specific joy activities (horseshoes, chess, etc.).

## Plan

### Files to Modify
- `src/renderer/src/simulation/types.ts` — Add `recreation: number` to CharacterNeeds
- `src/renderer/src/simulation/needs/needs-config.ts` — Add recreation to NeedId and NEED_CONFIGS
- `src/renderer/src/simulation/behaviors/need-satisfaction-system.ts` — Add "relax" action when recreation is low
- `src/renderer/src/simulation/jobs/job-factory.ts` — Add createRelaxJob (wander + restore_need)
- `src/renderer/src/agent-api.types.ts` — Add recreation to needs types
- `src/renderer/src/agent-api.ts` — Add recreation to spawnCharacter defaults

### Existing Code to Reuse
- `src/renderer/src/simulation/needs/needs-config.ts:NEED_CONFIGS` — follow existing pattern
- `src/renderer/src/simulation/jobs/job-factory.ts:createSleepJob` — similar structure (move + work + restore_need)
- `src/renderer/src/simulation/behaviors/need-satisfaction-system.ts:getMostUrgentAction` — extend with recreation priority

### Steps
1. Add `recreation: number` to CharacterNeeds and default to 1
2. Add recreation to NeedId union and NEED_CONFIGS with slow decay (0.0004/s, ~42 min to empty)
3. Add createRelaxJob to job-factory (short wander + restore 0.3 recreation)
4. Extend NeedSatisfactionSystem to handle recreation (lowest priority after comfort)
5. Update agent-api types to include recreation
6. Write tests for recreation need
7. Update existing tests that reference CharacterNeeds

## Acceptance Criteria
- [ ] Recreation need exists with passive decay
- [ ] Colonists auto-seek relaxation when recreation drops below threshold
- [ ] Recreation is restored by the relax job
- [ ] Agent API exposes recreation in character info and spawn options
- [ ] Tests pass, lint and typecheck clean
