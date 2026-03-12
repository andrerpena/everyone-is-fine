# Architect Menu Widget

**Priority:** medium
**Roadmap Item:** 130
**Created:** 2026-03-12

## Goal
Create an Architect widget that lists all buildable structures organized by category, showing construction costs and material requirements.

## Context
Buildings can be placed via `window.game.placeBlueprint()` but there's no UI showing what's available to build. Players need to see buildable structures, their categories, and material costs. This is the first step toward a full build menu — placement interaction will come in a future cycle.

## Plan

### Files to Modify
- `src/renderer/src/config/registry-ids.ts` — Add "architect" to WIDGET_IDS
- `src/renderer/src/components/widgets/definitions/index.ts` — Export new widget
- `src/renderer/src/components/widgets/register-widgets.ts` — Register new widget

### Files to Create
- `src/renderer/src/components/widgets/definitions/ArchitectWidget.tsx` — Architect menu showing buildable structures by category

### Existing Code to Reuse
- `src/renderer/src/world/registries/construction-registry.ts` — CONSTRUCTION_REGISTRY, ConstructionCost
- `src/renderer/src/world/registries/structure-registry.ts` — STRUCTURE_REGISTRY for category lookup
- `src/renderer/src/world/types.ts` — StructureType, StructureCategory

### Steps
1. Add "architect" to WIDGET_IDS
2. Create ArchitectWidget.tsx that iterates CONSTRUCTION_REGISTRY, groups by category, and shows each structure with its material costs
3. Export and register the widget

## Acceptance Criteria
- [ ] Widget lists all buildable structures grouped by category (Walls, Doors, Furniture, Machines, Containers)
- [ ] Each structure shows its material costs
- [ ] Widget is registered and accessible
- [ ] Quality gate passes (lint:fix + typecheck)
