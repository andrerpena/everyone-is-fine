# Specialized Workstation Buildings

**Priority:** medium
**Roadmap Item:** 121
**Created:** 2026-03-12

## Goal
Add stonecutter table, tailoring bench, and crafting spot as buildable workstation structures with distinct construction costs and properties.

## Context
Currently only a generic `workbench` exists. The game needs specialized workstations for different crafting categories: stonecutting (stone blocks from chunks), tailoring (apparel from cloth/leather), and a basic crafting spot (simple crafting with no materials). These are buildings only — the crafting jobs that use them will be implemented in future tickets.

## Plan

### Files to Modify
- `src/renderer/src/world/types.ts` — Add `"stonecutter_table"`, `"tailoring_bench"`, `"crafting_spot"` to StructureType union
- `src/renderer/src/world/registries/structure-registry.ts` — Add properties for each (all machine category, interactable, varying health/beauty/value)
- `src/renderer/src/world/registries/construction-registry.ts` — Add construction costs (stonecutter: stone+iron, tailoring: wood+cloth, crafting spot: wood only)
- `src/renderer/src/theming/default-game-colors.ts` — Add colors for new structure types
- `src/renderer/src/simulation/rooms/room-role.ts` — Update workshop detection to recognize new workstation types (if applicable)

### Existing Code to Reuse
- `src/renderer/src/world/registries/structure-registry.ts:workbench` — Pattern for machine-category structures
- `src/renderer/src/world/registries/construction-registry.ts:workbench` — Pattern for construction costs

### Steps
1. Add three new StructureType values to the union in types.ts
2. Add structure registry entries for each workstation
3. Add construction costs for each workstation
4. Add theme colors for new types
5. Update workshop room role detection to include new workstation types
6. Run quality gate

## Acceptance Criteria
- [ ] `stonecutter_table`, `tailoring_bench`, `crafting_spot` are valid StructureTypes
- [ ] Each has structure registry entry with appropriate properties
- [ ] Each has construction cost defined
- [ ] Theme colors exist for all three
- [ ] Workshop room role detects rooms with new workstations
- [ ] Quality gate passes (lint + typecheck)
