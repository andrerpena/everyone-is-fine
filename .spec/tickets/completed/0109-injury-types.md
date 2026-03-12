# Injury Types & Damage Application

**Priority:** medium
**Roadmap Item:** 159
**Created:** 2026-03-12

## Goal
Define injury types with damage values, add an injuries list to body part state, and create functions to apply and heal injuries — enabling characters to take and recover from damage.

## Context
The body part system (ticket 0108) provides 10 body parts with health tracking. This ticket adds the injury layer: what types of damage exist, how they reduce body part health, and how they heal over time. No capability effects yet (that's roadmap item 160). No bleeding/pain mechanics yet (items 161-162).

## Plan

### Files to Create
- `src/renderer/src/simulation/health/injuries.ts` — InjuryTypeId, InjuryDefinition, INJURY_DEFINITIONS, Injury interface, applyInjury(), naturalHealing()

### Files to Modify
- `src/renderer/src/simulation/health/body-parts.ts` — Add `injuries: Injury[]` to BodyPartState
- `src/renderer/src/simulation/types.ts` — No changes needed (bodyParts already on Character)
- `src/renderer/src/agent-api.ts` — Include injuries in body part info
- `src/renderer/src/agent-api.types.ts` — Add injuries to AgentBodyPartInfo

### Existing Code to Reuse
- `src/renderer/src/simulation/health/body-parts.ts` — BodyPartState, BodyPartsState, getOverallHealth
- `src/renderer/src/simulation/thoughts/thought-definitions.ts` — Registry pattern for injury definitions

### Steps
1. Define InjuryTypeId union (cut, bruise, gunshot, burn, bite, scratch, crush) and InjuryDefinition with baseDamage, healRate, label, description
2. Create Injury interface (id, typeId, bodyPartId, damage, healProgress 0-1)
3. Add `injuries: Injury[]` to BodyPartState, update createDefaultBodyParts
4. Create `applyInjury(bodyParts, bodyPartId, injuryTypeId)` — creates injury, reduces body part health
5. Create `naturalHealing(bodyParts, deltaTicks)` — advances healProgress on all injuries, restores health when fully healed, removes healed injuries
6. Expose injuries in agent API (id, type, bodyPart, damage, healProgress)
7. Write unit tests

## Acceptance Criteria
- [ ] 7 injury types defined with damage values and heal rates
- [ ] Injuries are stored per body part with damage and heal progress
- [ ] applyInjury reduces body part health by injury damage amount
- [ ] naturalHealing advances heal progress and restores health when healed
- [ ] Body part health cannot go below 0
- [ ] Agent API exposes injury details
- [ ] Unit tests verify apply/heal logic
