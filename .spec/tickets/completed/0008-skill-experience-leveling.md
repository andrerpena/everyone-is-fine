# Skill Experience Gain and Leveling

**Priority:** medium
**Roadmap Item:** 41
**Created:** 2026-03-11

## Goal
Add XP-based leveling mechanics to the skill system so colonists can improve skills through activities.

## Context
The skill system (ticket 0006) defines 12 skills with levels 0-20 and an `experience` field, but there's no logic for gaining XP or leveling up. This ticket adds the core leveling functions that future job/activity systems will call when colonists complete skill-related work.

## Plan

### Files to Modify
- `src/renderer/src/simulation/skills.ts` — Add XP calculation, granting, and level-up logic
- `src/renderer/src/simulation/index.ts` — Export new functions

### Existing Code to Reuse
- `src/renderer/src/simulation/skills.ts:SkillData` — Has level and experience fields
- `src/renderer/src/simulation/skills.ts:MAX_SKILL_LEVEL` — Cap at 20

### Steps
1. Add `xpForNextLevel(level)` — XP required to go from `level` to `level+1`, using an exponential curve (e.g., `(level + 1) * 100`)
2. Add `grantExperience(skills, skillId, amount)` — Adds XP to a skill, handles level-up(s) if XP exceeds threshold, caps at MAX_SKILL_LEVEL, returns updated skills and whether a level-up occurred
3. Add `getSkillProgress(skill)` — Returns 0-1 fraction of progress toward next level
4. Update `formatSkillsSummary` to show XP progress for skills with non-zero XP
5. Export new functions from simulation/index.ts
6. Run lint:fix + typecheck

## Acceptance Criteria
- [ ] `xpForNextLevel(level)` returns correct XP thresholds with exponential scaling
- [ ] `grantExperience` properly adds XP and triggers level-ups
- [ ] Multiple level-ups in one grant are handled correctly
- [ ] Skills cap at MAX_SKILL_LEVEL (20) and stop gaining XP
- [ ] `getSkillProgress` returns correct 0-1 fraction
- [ ] `npm run typecheck` and `npm run lint:fix` pass cleanly
