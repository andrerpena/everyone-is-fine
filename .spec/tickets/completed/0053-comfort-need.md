# Add Comfort Need

**Priority:** medium
**Roadmap Item:** 53
**Created:** 2026-03-11

## Goal
Add a comfort need that decays over time and is restored by sleeping, with beds providing bonus comfort restoration.

## Context
The game currently has hunger, energy, and mood needs. Comfort is a natural next need — it connects to the furniture system (beds, chairs) and the quality system already built. Colonists should seek comfort by sleeping in beds rather than on the ground. This creates meaningful gameplay: players build bedrooms with quality beds to keep colonists comfortable.

## Plan

### Files to Modify
- `src/renderer/src/simulation/types.ts` — Add `comfort: number` to `CharacterNeeds` interface
- `src/renderer/src/simulation/needs/needs-config.ts` — Add `"comfort"` to `NeedId` type and `NEED_CONFIGS` array
- `src/renderer/src/simulation/behaviors/need-satisfaction-system.ts` — Add comfort to `getMostUrgentAction()`, add `tryRestComfort()` that finds nearest bed, modify `trySleep()` to also find beds
- `src/renderer/src/simulation/jobs/job-factory.ts` — Modify `createSleepJob` to accept optional bed position and restore comfort alongside energy; add bed-quality-based comfort bonus
- `src/renderer/src/agent-api.ts` — Add comfort to the character info mapping
- `src/renderer/src/agent-api.types.ts` — Add comfort to the needs type in `AgentCharacterInfo`

### Files to Create
None — this extends existing systems.

### Existing Code to Reuse
- `src/renderer/src/simulation/needs/needs-system.ts:NeedsSystem` — Already handles decay for needs in NEED_CONFIGS, comfort will be auto-decayed
- `src/renderer/src/simulation/needs/needs-config.ts:NeedConfig` — Same config pattern for comfort
- `src/renderer/src/simulation/jobs/types.ts:RestoreNeedStep` — Used by sleep job, will also restore comfort
- `src/renderer/src/simulation/behaviors/need-satisfaction-system.ts` — Same pattern as tryForage/trySleep for finding beds
- `src/renderer/src/world/registries/structure-registry.ts` — Bed structure properties (quality, beauty)

### Steps
1. Add `comfort: number` to `CharacterNeeds` in types.ts and set default to 1.0 in `createCharacter()`
2. Add `"comfort"` to the `NeedId` union type and add config entry with slow decay (~0.0005/s, ~33 min to empty)
3. Update `createSleepJob` to accept optional `onBed: boolean` parameter — when true, add a second `RestoreNeedStep` for comfort (0.4 on bed, 0.15 on ground)
4. Modify `NeedSatisfactionSystem`:
   - Add comfort to `getMostUrgentAction()` — comfort is lower priority than hunger/energy
   - Modify `trySleep()` to search for nearby unoccupied beds first; sleep on bed if found, on ground if not
5. Update agent API to expose comfort in character info
6. Write tests for comfort decay, bed-finding, and restoration

## Acceptance Criteria
- [ ] Comfort need decays over time like hunger and energy
- [ ] Colonists seek beds when comfort is low
- [ ] Sleeping on a bed restores comfort (0.4) and energy (0.5)
- [ ] Sleeping on ground still restores energy (0.5) but less comfort (0.15)
- [ ] Comfort is visible in agent API character info
- [ ] All tests pass, lint and typecheck clean
