# Weapon Item Types

**Priority:** medium
**Roadmap Item:** 72
**Created:** 2026-03-11

## Goal
Add melee and ranged weapon item types to the item registry for future combat system use.

## Context
The ItemCategory "weapon" exists but no weapon items are defined. Adding weapon types now prepares for the combat system. This ticket adds type definitions and registry entries only — combat mechanics will come later.

## Plan

### Files to Modify
- `src/renderer/src/world/types.ts` — Add weapon types to ItemType union (knife, sword, spear, club for melee; bow, pistol for ranged)
- `src/renderer/src/world/registries/item-registry.ts` — Add registry entries with balanced properties

### Steps
1. Add 6 weapon types to ItemType union (4 melee, 2 ranged)
2. Add registry entries with appropriate properties (category: weapon, stack size 1, varying values/weights)
3. Write tests
4. Run quality gate

## Acceptance Criteria
- [ ] Six weapon types exist in ItemType (knife, sword, spear, club, bow, pistol)
- [ ] All have category "weapon" and stack size 1
- [ ] Tests verify weapon item properties
- [ ] Lint and typecheck pass
