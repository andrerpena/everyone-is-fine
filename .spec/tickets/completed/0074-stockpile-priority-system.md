# Stockpile Priority System

**Priority:** medium
**Roadmap Item:** 95
**Created:** 2026-03-12

## Goal
Add a priority field to stockpile zones so colonists prefer hauling items to higher-priority stockpiles first.

## Context
Currently all stockpiles are treated equally — the hauling system picks the first matching stockpile it finds. Players need to designate preferred vs. overflow stockpiles (e.g., a small "kitchen pantry" stockpile with high priority near the cooking area, and a bulk storage stockpile with low priority farther away). Priority levels: preferred (1), normal (2), low (3).

## Plan

### Files to Modify
- `src/renderer/src/zones/types.ts` — Add `priority?: ZonePriority` field to `ZoneData` and define `ZonePriority` type
- `src/renderer/src/zones/zone-store.ts` — Initialize stockpile zones with default priority "normal", add `setZonePriority` action
- `src/renderer/src/simulation/jobs/hauling-system.ts` — Sort stockpiles by priority (ascending numeric value) before searching for destinations

### Existing Code to Reuse
- `src/renderer/src/zones/zone-store.ts:setStockpileFilter` — Pattern for updating zone properties
- `src/renderer/src/simulation/jobs/hauling-system.ts:getStockpileZones` — Where to add sorting

### Steps
1. Define `ZonePriority` type (1=preferred, 2=normal, 3=low) and add `priority` field to `ZoneData` in `types.ts`.
2. Update `createZone` in `zone-store.ts` to set `priority: 2` (normal) for stockpile zones.
3. Add `setZonePriority` action to `zone-store.ts` following the `setStockpileFilter` pattern.
4. In `hauling-system.ts`, sort stockpiles by priority (ascending) in `getStockpileZones` so preferred stockpiles are checked first.
5. Add `AgentZoneInfo` priority field for agent API visibility.
6. Write unit tests for priority sorting logic.

## Acceptance Criteria
- [ ] `ZoneData` has an optional `priority` field with type `ZonePriority`
- [ ] New stockpile zones default to normal priority (2)
- [ ] `setZonePriority` action updates a zone's priority
- [ ] Hauling system prefers higher-priority (lower numeric value) stockpiles
- [ ] Unit tests verify priority sorting behavior
