# Colony Overview Widget

**Priority:** medium
**Roadmap Item:** 295
**Created:** 2026-03-12

## Goal
Add a colony overview widget that summarizes colonists, resources, and key colony metrics in a single panel.

## Context
There's no at-a-glance summary of colony state. Players must check multiple widgets to understand overall status. A colony overview consolidates colonist count, mood summary, resource totals, and room count into one place.

## Plan

### Files to Create
- `src/renderer/src/components/widgets/definitions/ColonyOverviewWidget.tsx` — Widget showing colony summary sections

### Files to Modify
- `src/renderer/src/config/registry-ids.ts` — Add "colony-overview" to WIDGET_IDS
- `src/renderer/src/components/widgets/definitions/index.ts` — Export new widget
- `src/renderer/src/components/widgets/register-widgets.ts` — Register new widget

### Existing Code to Reuse
- `world/utils/material-counter.ts:countAllItemsOnMap` — aggregate item counts
- `game-state/hooks/useSimulation.ts:useCharactersArray` — colonist data
- `game-state/hooks/useSimulation.ts:useWorld` — world/item data
- `world/registries/item-registry.ts:ITEM_REGISTRY` — item labels
- `simulation/needs/needs-config.ts:getNeedThreshold` — need level checks

### Steps
1. Create ColonyOverviewWidget with sections: Colonists (count, avg mood, need warnings), Resources (item counts grouped by category), Rooms (count)
2. Register the widget in registry-ids, definitions/index, register-widgets
3. Use existing countAllItemsOnMap for resource totals

## Acceptance Criteria
- [ ] Widget shows colonist count and average mood
- [ ] Widget shows resource totals grouped by category
- [ ] Widget registered and accessible in the dock system
