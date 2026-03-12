# Work Tab Widget

**Priority:** medium
**Roadmap Item:** 84
**Created:** 2026-03-12

## Goal
Create a Work Tab widget that displays a grid of all colonists × work types, allowing players to view and edit work priority levels (0-4) for each colonist.

## Context
Work priorities already exist in the data model (`Character.workPriorities`) and are used by auto-assignment systems (cooking, sowing, hauling, etc.). However, there's no UI to view or modify them. Players need a RimWorld-style work grid to manage their colonists' job assignments.

## Plan

### Files to Modify
- `src/renderer/src/config/registry-ids.ts` — Add "work-priorities" to WIDGET_IDS
- `src/renderer/src/components/widgets/definitions/index.ts` — Export new widget
- `src/renderer/src/components/widgets/register-widgets.ts` — Register new widget

### Files to Create
- `src/renderer/src/components/widgets/definitions/WorkPrioritiesWidget.tsx` — Work tab grid component

### Existing Code to Reuse
- `src/renderer/src/simulation/work-priorities.ts:ALL_WORK_TYPES` — Work type list
- `src/renderer/src/simulation/work-priorities.ts:WorkPriorityLevel` — Priority type
- `src/renderer/src/game-state/hooks/useSimulation.ts:useCharactersArray` — Get all colonists
- `src/renderer/src/game-state/store.ts:updateCharacter` — Update character data

### Steps
1. Add "work-priorities" to WIDGET_IDS in registry-ids.ts
2. Create WorkPrioritiesWidget.tsx with a table grid: rows = colonists, columns = work types
3. Each cell shows the priority number (0-4), clickable to cycle through values
4. Export and register the widget

## Acceptance Criteria
- [ ] Widget shows all colonists with their work priorities in a grid
- [ ] Clicking a priority cell cycles through 0→1→2→3→4→0
- [ ] Changes persist via updateCharacter
- [ ] Widget is registered and accessible from the widget system
- [ ] Quality gate passes (lint:fix + typecheck)
