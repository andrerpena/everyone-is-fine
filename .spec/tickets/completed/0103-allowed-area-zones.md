# Allowed Area Zones

**Priority:** medium
**Roadmap Item:** 92
**Created:** 2026-03-12

## Goal
Add allowed area zones that restrict colonist movement to designated tiles, with pathfinding integration.

## Context
The zone system supports stockpile, growing, and dumping zones. Allowed areas are a new zone type that, when assigned to a colonist, restricts their pathfinding to only tiles within the zone. This is essential for safety (keeping colonists out of dangerous areas) and organization.

## Plan

### Files to Modify
- `src/renderer/src/zones/types.ts` — Add `"allowed_area"` to `ZoneType`, add color
- `src/renderer/src/simulation/types.ts` — Add `allowedAreaId: string | null` to `Character`, default in `createCharacter`
- `src/renderer/src/simulation/pathfinding/types.ts` — Add `allowedTiles?: ReadonlySet<string>` to `PathfinderOptions`
- `src/renderer/src/simulation/pathfinding/astar.ts` — Check `allowedTiles` in `isPassable`
- `src/renderer/src/simulation/jobs/job-processor.ts` — Pass allowed tiles when pathfinding for job assignments
- `src/renderer/src/simulation/behaviors/idle-behavior.ts` — Pass allowed tiles for idle wandering
- `src/renderer/src/simulation/behaviors/mental-break-system.ts` — Pass allowed tiles for mental break wandering
- `src/renderer/src/agent-api.ts` — Add methods to assign/unassign allowed areas to colonists

### Existing Code to Reuse
- `src/renderer/src/zones/zone-store.ts:useZoneStore` — Zone CRUD and tile lookups
- `src/renderer/src/simulation/pathfinding/astar.ts:AStarPathfinder` — Pathfinding with options

### Steps
1. Add `"allowed_area"` to `ZoneType` union and zone colors
2. Add `allowedAreaId` field to `Character` interface and `createCharacter` default
3. Add `allowedTiles` option to `PathfinderOptions`
4. Update A* `isPassable` to check allowed tiles (tile key format "x,y")
5. Create helper function to resolve a character's allowed tiles from zone store
6. Pass allowed tiles in job-processor, idle-behavior, and mental-break-system pathfinding calls
7. Add agent API methods: `setAllowedArea(characterId, zoneId)`, `clearAllowedArea(characterId)`
8. Write unit tests for pathfinding with allowed tiles constraint

## Acceptance Criteria
- [ ] `"allowed_area"` is a valid zone type that can be created
- [ ] Characters have an `allowedAreaId` field (null by default = unrestricted)
- [ ] A* pathfinder respects `allowedTiles` option — paths only through allowed tiles
- [ ] Job processor passes allowed tiles when pathfinding for assigned colonists
- [ ] Idle and mental break wandering respect allowed areas
- [ ] Agent API can assign/clear allowed areas on colonists
- [ ] Unit tests verify pathfinding constraint works correctly
