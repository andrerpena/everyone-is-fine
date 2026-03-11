# Building Quality Based on Constructor Skill Level

**Priority:** medium
**Roadmap Item:** 129
**Created:** 2026-03-11

## Goal
Add a quality field to structures that is determined by the builder's construction skill level, affecting room stats.

## Context
The construction system (ticket 0044) places structures at full health but with no quality variation. The skill system tracks construction skill levels (0-20). Items already have a `quality` field (0-1). This ticket extends structures with the same quality concept, determined by the builder's skill. Higher quality structures contribute more beauty and value to rooms.

## Plan

### Files to Modify
- `src/renderer/src/world/types.ts` — Add optional `quality` field to StructureData
- `src/renderer/src/simulation/jobs/job-processor.ts` — In `executePlaceStructure`, calculate quality from builder's construction skill and set it on the structure
- `src/renderer/src/simulation/rooms/room-stats.ts` — Multiply structure beauty and value by quality when computing room stats

### Files to Create
- `src/renderer/src/simulation/quality.ts` — Quality calculation: skill level → quality value (0-1 scale), with quality label helpers

### Existing Code to Reuse
- `src/renderer/src/simulation/skills.ts:JOB_SKILL_MAP` — Maps "build" to "construction" skill
- `src/renderer/src/simulation/skills.ts:getWorkSpeedMultiplier` — Pattern for skill-based scaling
- `src/renderer/src/simulation/jobs/job-processor.ts:executePlaceStructure` — Where structures are created
- `src/renderer/src/world/types.ts:ItemData.quality` — Existing 0-1 quality pattern on items

### Steps
1. Create `quality.ts` with:
   - `calculateQualityFromSkill(skillLevel: number): number` — Base quality from skill with random variance. Formula: base = skill/20 * 0.6 + 0.2 (range 0.2 to 0.8 at skill 20), then add random ±0.1, clamp to [0, 1]. Very low skill can produce awful quality, high skill produces good quality.
   - `getQualityLabel(quality: number): string` — Maps quality ranges to labels: awful (0-0.2), poor (0.2-0.4), normal (0.4-0.6), good (0.6-0.8), excellent (0.8-0.95), masterwork (0.95-1.0)
2. Add `quality?: number` to `StructureData` in types.ts (optional for backwards compat)
3. Modify `executePlaceStructure` in job-processor.ts to look up builder's construction skill level, call `calculateQualityFromSkill`, and set quality on the placed structure
4. Modify `calculateRoomStats` in room-stats.ts to use `tile.structure.quality ?? 1` as a multiplier on beauty and baseValue
5. Write tests for quality calculation and label mapping

## Acceptance Criteria
- [ ] StructureData has optional quality field (0-1)
- [ ] calculateQualityFromSkill produces quality scaled by skill level
- [ ] Placed structures have quality set from builder's construction skill
- [ ] Room stats beauty/value are scaled by structure quality
- [ ] Quality labels map to correct ranges
- [ ] lint:fix and typecheck pass
