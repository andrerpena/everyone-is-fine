# Zone Management Widget

**Priority:** medium
**Roadmap Item:** 94
**Created:** 2026-03-12

## Goal
Create a Zone Management widget that lists all zones with their type, name, tile count, and priority/crop settings, with the ability to rename and delete zones.

## Context
Zones (stockpile, growing, dumping) can be created via the game API but there's no UI to view, configure, or delete them. Players need a panel to manage their zones at a glance.

## Plan

### Files to Modify
- `src/renderer/src/config/registry-ids.ts` — Add "zones" to WIDGET_IDS
- `src/renderer/src/components/widgets/definitions/index.ts` — Export new widget
- `src/renderer/src/components/widgets/register-widgets.ts` — Register new widget

### Files to Create
- `src/renderer/src/components/widgets/definitions/ZonesWidget.tsx` — Zone management panel

### Existing Code to Reuse
- `src/renderer/src/zones/zone-store.ts` — useZoneStore with getAllZones, deleteZone, setZonePriority, setGrowingZoneCrop
- `src/renderer/src/zones/types.ts` — ZoneData, ZoneType, ZonePriority

### Steps
1. Add "zones" to WIDGET_IDS in registry-ids.ts
2. Create ZonesWidget.tsx showing a table of all zones with: name, type, tile count, priority (stockpile), crop (growing)
3. Add delete button per zone
4. Add priority cycling for stockpile zones (click to cycle Preferred/Normal/Low)
5. Export and register the widget

## Acceptance Criteria
- [ ] Widget lists all zones with type, name, and tile count
- [ ] Stockpile zones show clickable priority (Preferred/Normal/Low)
- [ ] Growing zones show crop type
- [ ] Delete button removes zones
- [ ] Widget registered and accessible
- [ ] Quality gate passes (lint:fix + typecheck)
