# Skill-Based Job Assignment

**Priority:** medium
**Roadmap Item:** 77
**Created:** 2026-03-11

## Goal
Enhance job assignment to prefer higher-skilled colonists when priorities are equal, so that the best cook is preferred for cooking jobs, the best builder for construction, etc.

## Context
The work priority system (ticket 0063) assigns jobs by priority level (1-4), then by distance. When two colonists have equal priority for a work type, the closer one is chosen regardless of skill. This ticket adds skill level as a secondary tiebreaker (after priority, before distance), so specialized colonists are naturally preferred for their area of expertise.

## Plan

### Files to Modify
- `src/renderer/src/simulation/work-priorities.ts` — Add WORK_TYPE_SKILL_MAP, include skillLevel in EligibleCharacter, update sort to use priority → skill (desc) → distance

### Files to Modify (tests)
- `src/renderer/src/simulation/work-priorities.test.ts` — Add tests for skill-based tiebreaking

### Existing Code to Reuse
- `src/renderer/src/simulation/skills.ts:SkillId` — Skill identifier type
- `src/renderer/src/simulation/skills.ts:JOB_SKILL_MAP` — Existing job-to-skill mapping (reference pattern)

### Steps
1. Add `WORK_TYPE_SKILL_MAP: Record<WorkType, SkillId>` mapping each work type to its relevant skill
2. Add `skillLevel` to `EligibleCharacter` interface
3. Update `getEligibleCharacters` to look up character skill level and include it
4. Update sort: priority (asc) → skillLevel (desc) → distance (asc)
5. Add tests verifying skill tiebreaking behavior

## Acceptance Criteria
- [ ] Each WorkType maps to a SkillId
- [ ] Among equal-priority colonists, higher-skilled ones are preferred
- [ ] Among equal-priority-and-skill colonists, closest is still preferred
- [ ] Existing priority ordering is preserved (skill is secondary)
- [ ] Tests cover skill-based tiebreaking
- [ ] Typecheck and lint pass
