# Wild Plant Foraging — Berry Bushes and Healroot

**Priority:** medium
**Roadmap Item:** 111
**Created:** 2026-03-12

## Goal
Add bush_berry and bush_healroot structure variants so foraging produces distinct items (berries and herbal medicine) instead of just restoring hunger.

## Context
Currently there's a single "bush" structure type. Foraging restores 0.3 hunger directly. The roadmap wants berry bushes (produce berries) and wild healroot (produces medicine_herbal). Both item types already exist in the item registry.

## Plan

### Files to Modify
- `src/renderer/src/world/types.ts` — Add `"bush_berry"` and `"bush_healroot"` to StructureType union
- `src/renderer/src/world/registries/structure-registry.ts` — Add entries for both bush variants (natural, non-blocking, interactable)
- `src/renderer/src/theming/default-game-colors.ts` — Add colors for new bush types
- `src/renderer/src/simulation/jobs/action-rules.ts` — Update forage rule to match `bush_berry` and `bush_healroot` (in addition to generic `bush`), and create variant-specific jobs
- `src/renderer/src/simulation/jobs/job-factory.ts` — Update `createForageJob` to accept an item type parameter, so berry foraging spawns berries and healroot foraging spawns medicine_herbal
- `src/renderer/src/world/factories/procedural-generator.ts` — Replace generic bush spawning with weighted random of bush/bush_berry/bush_healroot

### Existing Code to Reuse
- `src/renderer/src/world/registries/item-registry.ts` — `berries` and `medicine_herbal` already defined
- `src/renderer/src/simulation/jobs/job-factory.ts:createForageJob` — Base pattern, needs item spawn step added
- `src/renderer/src/world/factories/procedural-generator.ts` — Bush spawning logic in Pass 4

### Steps
1. Add `"bush_berry"` and `"bush_healroot"` to StructureType union
2. Add structure registry entries (similar to bush but with slight differences in beauty)
3. Add theme colors for new bush types
4. Modify `createForageJob` to accept a yield parameter: `{ type: ItemType, quantity: number }`. Berry → spawn berries × 3, healroot → spawn medicine_herbal × 1. Keep hunger restore for generic bush.
5. Update action rules to match all bush types and create appropriate jobs
6. Update procedural generator to spawn bush variants: ~60% generic bush, ~30% bush_berry, ~10% bush_healroot
7. Run quality gate

## Acceptance Criteria
- [ ] `bush_berry` and `bush_healroot` are valid StructureTypes with registry entries
- [ ] Foraging berry bushes spawns `berries` items
- [ ] Foraging healroot bushes spawns `medicine_herbal` items
- [ ] Generic bush foraging still restores hunger as before
- [ ] World generation spawns all three bush variants
- [ ] Quality gate passes (lint + typecheck)
