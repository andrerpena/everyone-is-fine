# Home Zone (Auto-Expanding Around Buildings)

**Priority:** medium
**Roadmap Item:** 97
**Created:** 2026-03-12

## Goal
Add a "home" zone type that auto-expands to include tiles near constructed structures, used by the cleaning system to limit where colonists sweep filth.

## Context
The zone system supports stockpile, growing, dumping, and allowed_area zones. The cleaning system currently creates clean jobs for any tile with filth > 0 (action-rules.ts, priority 4). In a real colony sim, colonists should only clean within the "home" zone — not chase filth into the wilderness. The home zone auto-expands as buildings are placed and shrinks when they're deconstructed.

## Plan

### Files to Modify
- `src/renderer/src/zones/types.ts` — Add `"home"` to `ZoneType` union, add a green-yellow color
- `src/renderer/src/zones/zone-store.ts` — Add `homeZoneTiles` derived set and `rebuildHomeZone()` action that scans all tiles with structures and expands a radius around them
- `src/renderer/src/simulation/jobs/action-rules.ts` — Update the clean action rule to only match tiles inside the home zone
- `src/renderer/src/components/panels/zones/ZonesWidget.tsx` — Add home zone display entry (non-editable, auto-managed)

### Files to Create
- `src/renderer/src/zones/home-zone.ts` — Pure function `computeHomeZoneTiles(world, radius)` that scans tiles for structures and returns a `Set<string>` of tile keys within radius

### Existing Code to Reuse
- `src/renderer/src/zones/zone-store.ts` — Zone CRUD and tileToZone lookup
- `src/renderer/src/simulation/jobs/action-rules.ts` — Clean action rule condition
- `src/renderer/src/simulation/jobs/job-processor.ts:executeCleanTile` — Clean tile execution
- `src/renderer/src/world/types.ts` — Tile.structure for detecting buildings

### Steps
1. Add `"home"` to `ZoneType` in types.ts with a distinct color (e.g., 0xa0d070, light green-yellow)
2. Create `home-zone.ts` with `computeHomeZoneTiles(world, radius=3)`: iterate all tiles, for each tile with a non-null structure, add all tiles within `radius` Manhattan distance to the set
3. Add `homeZoneTiles: Set<string>` to zone store state and a `rebuildHomeZone(world)` action that calls `computeHomeZoneTiles` and updates the set
4. Call `rebuildHomeZone` after construction completes (in job-processor.ts after setting tile.structure) and after deconstruction
5. Update the clean action rule in action-rules.ts to check `homeZoneTiles.has(tileKey)` before creating clean jobs
6. Add home zone entry to ZonesWidget (show tile count, non-deletable)
7. Write unit tests for `computeHomeZoneTiles`

## Acceptance Criteria
- [ ] Home zone tiles automatically include a radius around any constructed structure
- [ ] Cleaning jobs only target tiles within the home zone
- [ ] Home zone updates when buildings are constructed or deconstructed
- [ ] Home zone is visible in the zones widget with tile count
- [ ] Unit tests verify tile computation logic
