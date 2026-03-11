# Skill System

**Priority:** high
**Roadmap Item:** 40
**Created:** 2026-03-11

## Goal
Add a skill system to colonists with defined skill types, levels, and experience, with initial skills generated at character creation.

## Context
Colonists currently have biography (name, age, gender), needs (hunger, energy, mood), and movement data, but no skills. Skills are foundational for future systems: job assignment (item 77), crafting, combat accuracy, construction quality, and more. RimWorld-style skills with 0-20 levels and XP-based progression.

## Plan

### Files to Create
- `src/renderer/src/simulation/skills.ts` — Skill type definitions, skill registry, and initial skill generation

### Files to Modify
- `src/renderer/src/simulation/types.ts` — Add `skills` field to Character interface, update `createCharacter` default
- `src/renderer/src/simulation/entity-store.ts` — Add skills to `mergeCharacter` deep merge
- `src/renderer/src/simulation/colonist-generator.ts` — Generate initial skills during identity creation
- `src/renderer/src/simulation/index.ts` — Export skill types and functions
- `src/renderer/src/components/widgets/definitions/ColonistInfoWidget.tsx` — Display skills in inspector
- `src/renderer/src/schemas/definitions/colonist-inspector-schema.ts` — Add skills summary field

### Existing Code to Reuse
- `src/renderer/src/simulation/colonist-generator.ts:generateColonistIdentity` — Pattern for RNG-based generation
- `src/renderer/src/schemas/definitions/colonist-inspector-schema.ts` — Schema pattern with form groups

### Steps
1. Create `skills.ts` with:
   - `SkillId` type union: "shooting", "melee", "construction", "mining", "cooking", "plants", "animals", "crafting", "medicine", "social", "artistic", "intellectual"
   - `SkillData` interface: `{ level: number; experience: number }` (level 0-20, XP for next level)
   - `CharacterSkills` type: `Record<SkillId, SkillData>`
   - `SKILL_DEFINITIONS` array with id, label, description
   - `createDefaultSkills()` — all skills at level 0
   - `generateRandomSkills(rng)` — random starting levels (1-8 range, with most skills low)
2. Add `skills: CharacterSkills` to Character interface and `createCharacter` default
3. Update `mergeCharacter` to handle skills
4. Update `generateColonistIdentity` to include skills generation
5. Add skills summary to ColonistInfoWidget (show as formatted text string)
6. Run lint:fix + typecheck

## Acceptance Criteria
- [ ] Character interface includes skills field with all 12 skill types
- [ ] New colonists are generated with random starting skill levels
- [ ] Skills are visible in the Colonist Info widget
- [ ] Skills data serializes/deserializes correctly
- [ ] `npm run typecheck` and `npm run lint:fix` pass cleanly
