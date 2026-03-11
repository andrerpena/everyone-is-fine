# Passion System

**Priority:** medium
**Roadmap Item:** 42
**Created:** 2026-03-11

## Goal
Add a passion system to skills so each colonist has varying interest levels (none, minor, major) per skill, affecting XP gain rate and providing character differentiation.

## Context
The skill system (ticket 0006) and XP leveling (ticket 0008) are complete. Skills have levels and experience, but all colonists gain XP at the same rate. A passion system adds personality to colonists — some love certain work and improve faster, others have no interest. This is a core RimWorld mechanic that makes colonist assignment decisions meaningful.

## Plan

### Files to Modify
- `src/renderer/src/simulation/skills.ts` — Add Passion type, extend SkillData with passion field, add XP multiplier logic, update generation
- `src/renderer/src/simulation/index.ts` — Export new types and constants
- `src/renderer/src/simulation/skills.test.ts` — Add tests for passion-modified XP gain
- `src/renderer/src/schemas/definitions/colonist-inspector-schema.ts` — Update skills display to show passion indicators

### Existing Code to Reuse
- `src/renderer/src/simulation/skills.ts:SkillData` — Extend with passion field
- `src/renderer/src/simulation/skills.ts:grantExperience` — Modify to apply passion multiplier
- `src/renderer/src/simulation/skills.ts:generateRandomSkills` — Add passion assignment during generation
- `src/renderer/src/simulation/skills.ts:formatSkillsSummary` — Show passion indicators (★/★★)
- `src/renderer/src/simulation/entity-store.ts:mergeCharacter` — Already deep-merges skills

### Steps
1. Add `Passion` type (`"none" | "minor" | "major"`) and `PASSION_XP_MULTIPLIERS` constant (`{ none: 1, minor: 1.5, major: 2 }`)
2. Extend `SkillData` interface to include `passion: Passion` field
3. Update `createDefaultSkills()` to set `passion: "none"` for all skills
4. Update `generateRandomSkills()` to randomly assign passions: ~50% none, ~35% minor (3-5 skills), ~15% major (1-2 skills)
5. Modify `grantExperience()` to multiply XP amount by the skill's passion multiplier before processing
6. Update `formatSkillsSummary()` to append passion indicators (★ for minor, ★★ for major)
7. Export new types (`Passion`, `PASSION_XP_MULTIPLIERS`) from `simulation/index.ts`
8. Add unit tests for passion-modified XP gain (minor = 1.5x, major = 2x, none = 1x)
9. Run lint:fix + typecheck

## Acceptance Criteria
- [ ] `Passion` type exists with three levels: "none", "minor", "major"
- [ ] `SkillData` includes a `passion` field
- [ ] `generateRandomSkills` assigns passions with appropriate distribution
- [ ] `grantExperience` applies passion XP multiplier correctly
- [ ] `formatSkillsSummary` shows passion indicators (★/★★)
- [ ] Unit tests cover passion-modified XP gain
- [ ] `npm run typecheck` and `npm run lint:fix` pass cleanly
