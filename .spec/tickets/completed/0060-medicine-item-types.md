# Medicine Item Types

**Priority:** medium
**Roadmap Item:** 71
**Created:** 2026-03-11

## Goal
Add three medicine item types (herbal medicine, industrial medicine, glitterworld medicine) to the item registry.

## Context
The ItemCategory "medicine" already exists in types.ts but no actual medicine items are defined. Medicine items are needed for future health/injury systems. This ticket adds the type definitions and registry entries — the actual healing mechanics will come in a later ticket.

## Plan

### Files to Modify
- `src/renderer/src/world/types.ts` — Add medicine_herbal, medicine_industrial, medicine_glitterworld to ItemType union
- `src/renderer/src/world/registries/item-registry.ts` — Add registry entries for each medicine type with appropriate properties

### Existing Code to Reuse
- `src/renderer/src/world/types.ts:ItemType` — extend the union
- `src/renderer/src/world/registries/item-registry.ts:ITEM_REGISTRY` — follow existing pattern

### Steps
1. Add three medicine types to ItemType union
2. Add registry entries with balanced properties (value, weight, stack size)
3. Write tests for the new medicine items
4. Run quality gate

## Acceptance Criteria
- [ ] Three medicine types exist in ItemType
- [ ] Each has appropriate registry properties (category: medicine)
- [ ] Tests verify medicine item properties
- [ ] Lint and typecheck pass
