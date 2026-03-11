# Colonist Activity Status in Info Panel

**Priority:** medium
**Roadmap Item:** developer-initiated (improves game readability)
**Created:** 2026-03-11

## Goal
Show a human-readable "Activity" field in the colonist info panel describing what the colonist is currently doing.

## Context
The colonist info panel shows `controlMode` (idle/drafted) and `currentCommand` (None), but these don't tell the player what the colonist is actually doing. With foraging, sleeping, wandering, mental breaks, and various jobs, the player needs a clear activity description like "Foraging", "Sleeping", "Chopping Tree", "Mental Break: Sad Wander", etc.

## Plan

### Files to Modify
- `src/renderer/src/components/widgets/definitions/ColonistInfoWidget.tsx` — Add activity field computed from job progress, mental break state, and movement
- `src/renderer/src/schemas/definitions/colonist-inspector-schema.ts` — Add `activity` field to schema and data interface, place it in Status group

### Steps
1. Add `activity` string field to colonist inspector schema (readonly, in Status group)
2. Add `activity` to ColonistInspectorData interface
3. In ColonistInfoWidget, compute activity string from:
   - Mental break → "Mental Break: [type]"
   - Job progress → job type label (Chopping, Mining, Foraging, Sleeping, Moving)
   - Moving (no job) → "Walking"
   - Default → "Idle"
4. Add a useGameStore selector to get jobProgress for the selected character

## Acceptance Criteria
- [ ] Activity field shows in colonist info panel Status group
- [ ] Shows "Mental Break: Sad Wander/Food Binge/Daze" during mental breaks
- [ ] Shows job-specific labels (Chopping, Mining, Foraging, Sleeping)
- [ ] Shows "Idle" when colonist has no job and is not moving
- [ ] Updates in real-time as colonist state changes
