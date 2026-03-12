# Body Part System (Data Model & Definitions)

**Priority:** medium
**Roadmap Item:** 158
**Created:** 2026-03-12

## Goal
Define the body part data model with health tracking per part, integrate it into the Character type, and expose it via the agent API — laying the foundation for injuries, medical treatment, and combat.

## Context
The Character type has needs, skills, traits, thoughts, and relationships but no body/health representation. Phase 12 (Health System) requires a body part model as the foundation for injuries (159), bleeding (161), pain (162), diseases (163), surgery (167), and death (172). This ticket covers only the data model and definitions — no injury/damage mechanics yet.

## Plan

### Files to Create
- `src/renderer/src/simulation/health/body-parts.ts` — BodyPartId type, BodyPartDefinition, BODY_PART_DEFINITIONS registry, BodyPartState interface, createDefaultBodyParts()

### Files to Modify
- `src/renderer/src/simulation/types.ts` — Add `bodyParts: BodyPartsState` to Character, initialize in createCharacter()
- `src/renderer/src/agent-api.ts` — Expose body part health in character info
- `src/renderer/src/agent-api.types.ts` — Add AgentBodyPartInfo type and bodyParts field to AgentCharacterInfo

### Existing Code to Reuse
- `src/renderer/src/simulation/traits.ts` — Registry pattern (TraitId union + TRAIT_DEFINITIONS array + definition lookup)
- `src/renderer/src/simulation/skills.ts` — createDefaultSkills() pattern for initialization

### Steps
1. Create body-parts.ts with BodyPartId union (head, torso, left_arm, right_arm, left_leg, right_leg, left_hand, right_hand, left_foot, right_foot), BodyPartDefinition (label, maxHealth, vital flag, parent), BodyPartState (health, maxHealth), createDefaultBodyParts()
2. Add `bodyParts` to Character interface and createCharacter()
3. Expose body parts (id, label, health, maxHealth) via agent API
4. Write unit tests for createDefaultBodyParts()

## Acceptance Criteria
- [ ] BodyPartId covers 10 body parts with hierarchy (limbs have parent torso/arms/legs)
- [ ] Each body part tracks current health and max health
- [ ] Vital body parts (head, torso) are flagged
- [ ] createDefaultBodyParts() initializes all parts at full health
- [ ] Character type includes bodyParts field
- [ ] Agent API exposes body part health info
- [ ] Unit tests verify initialization logic
