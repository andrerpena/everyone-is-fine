# Dumping Zone Hauling Integration

**Priority:** medium
**Roadmap Item:** 91
**Created:** 2026-03-12

## Goal
Make dumping zones functional by having the hauling system use them as a fallback destination for items that don't match any stockpile filter.

## Context
The dumping zone type already exists in the zone system (type, color, creation) but has no hauling behavior. Items rejected by all stockpile filters currently stay on the ground. Dumping zones should serve as a catch-all destination. Items already inside dumping or stockpile zones should not be re-hauled.

## Plan

### Files to Modify
- `src/renderer/src/simulation/jobs/hauling-system.ts` — Add dumping zone fallback: when no stockpile accepts an item, try to haul it to a dumping zone. Also skip items already in dumping zones.

### Steps
1. In the hauling system scan loop, skip tiles already in dumping zones (alongside existing stockpile skip).
2. Add `getDumpingZones()` method that fetches zones with type "dumping".
3. Add `findDumpingDestination()` method that finds an open tile in any dumping zone.
4. In the item hauling loop, after `findStockpileDestination` returns null, try `findDumpingDestination` as fallback.
5. Write unit tests for the fallback logic.

## Acceptance Criteria
- [ ] Items on the ground that don't match any stockpile filter get hauled to dumping zones
- [ ] Items already in dumping zones are not re-hauled
- [ ] Items already in stockpile zones are still not re-hauled
- [ ] Stockpile zones are still preferred over dumping zones (dumping is fallback only)
