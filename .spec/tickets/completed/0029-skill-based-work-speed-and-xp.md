# Skill-Based Work Speed and XP Gain

**Priority:** high
**Roadmap Item:** developer-initiated
**Created:** 2026-03-11

## Goal
Make colonist skills affect job performance speed and grant XP on job completion, making each colonist's skill profile meaningful for gameplay.

## Context
Skills exist with levels (0-20), passions, and XP gain functions, but they don't affect any gameplay. A mining skill 10 colonist mines at the same speed as a level 0 colonist. This ticket connects skills to jobs: higher skill → faster work, and completing work → XP gain.

## Plan

### Files to Modify
- `src/renderer/src/simulation/skills.ts` — Add `getWorkSpeedMultiplier(level)` utility and `JOB_SKILL_MAP` constant
- `src/renderer/src/simulation/jobs/job-processor.ts` — Use skill multiplier in work step; grant XP on work step completion

### Existing Code to Reuse
- `src/renderer/src/simulation/skills.ts:grantExperience` — XP grant on job completion
- `src/renderer/src/simulation/entity-store.ts:EntityStore.update` — Persist updated skills

### Steps
1. Add `getWorkSpeedMultiplier(level: number): number` to skills.ts — returns 1.0 at level 0, scaling to 2.0 at level 20 (linear: 1 + level * 0.05)
2. Add `JOB_SKILL_MAP: Record<string, SkillId>` mapping job types to skills: chop→plants, mine→mining, forage→plants
3. In JobProcessor work step: look up character's relevant skill, compute multiplier, increment ticksWorked by multiplier instead of 1
4. When work step completes: grant XP to the relevant skill (base 20 XP per completion), persist updated skills via entityStore.update
5. Add unit tests for getWorkSpeedMultiplier

## Acceptance Criteria
- [ ] Higher skill level → faster work completion (observable: mining level 10 finishes ~50% faster)
- [ ] Completing work grants XP to the relevant skill
- [ ] Jobs without a mapped skill (move, sleep, wander) work at base speed with no XP
- [ ] Typecheck and lint pass
- [ ] Unit tests for getWorkSpeedMultiplier pass
