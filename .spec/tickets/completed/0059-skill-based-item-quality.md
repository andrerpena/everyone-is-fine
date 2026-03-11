# Skill-Based Item Quality

**Priority:** medium
**Roadmap Item:** 65
**Created:** 2026-03-11

## Goal
Wire the existing quality system into item spawning so that crafted/produced items get quality based on the colonist's skill level.

## Context
The quality calculation system (`calculateQualityFromSkill`, `getQualityLabel`) and quality tiers (Awful → Masterwork) already exist. Structures already use skill-based quality during construction. However, all items spawned by jobs (cooking, harvesting, mining) are hardcoded to `quality: 1`. This ticket connects the existing quality system to item production.

## Plan

### Files to Modify
- `src/renderer/src/simulation/jobs/types.ts` — Add optional `skillId` to SpawnItemsStep so the job processor knows which skill to use for quality
- `src/renderer/src/simulation/jobs/job-processor.ts` — Update `executeSpawnItems` to calculate quality from character skill when `skillId` is present
- `src/renderer/src/simulation/jobs/job-factory.ts` — Add `skillId` to cook, harvest, and mine job spawn steps

### Existing Code to Reuse
- `src/renderer/src/simulation/quality.ts:calculateQualityFromSkill` — quality calculation
- `src/renderer/src/simulation/skills.ts:SkillId` — skill identifiers
- `src/renderer/src/simulation/jobs/job-processor.ts:executePlaceStructure` — reference implementation that already uses skill-based quality

### Steps
1. Add optional `skillId?: string` to SpawnItemsStep
2. Update `executeSpawnItems` in job-processor to use `calculateQualityFromSkill` when `skillId` is set
3. Add `skillId: "cooking"` to createCookJob's spawn step
4. Add `skillId: "plants"` to createHarvestJob's spawn step
5. Write tests for skill-based quality in spawn items
6. Run quality gate

## Acceptance Criteria
- [ ] SpawnItemsStep supports optional skillId
- [ ] Cooked meals get quality based on cooking skill
- [ ] Harvested crops get quality based on plants skill
- [ ] Items without skillId still default to quality 1
- [ ] Tests pass, lint and typecheck clean
