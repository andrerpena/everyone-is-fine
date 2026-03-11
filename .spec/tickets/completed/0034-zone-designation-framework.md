# Zone Designation Framework

**Priority:** high
**Roadmap Item:** 88, 93
**Created:** 2026-03-11

## Goal
Add a zone system where areas of tiles can be designated with a type (stockpile, growing, dumping), stored in a dedicated zone store, rendered as colored overlays, and exposed via the agent API.

## Context
Zones are foundational for stockpiles, farming, and hauling. The game already has `"zone"` in SelectableEntityType and InteractionMode (game-state/types.ts), and `stockpile_zone` as a StructureType. However, zones should live in their own store (not in tile structures) since they span multiple tiles. This ticket creates the data model, store, rendering, and agent API. No zone UI panel or item filters yet — those come in future tickets.

## Plan

### Files to Create
- `src/renderer/src/zones/types.ts` — Zone data types (ZoneType, ZoneData, ZoneTileKey)
- `src/renderer/src/zones/zone-store.ts` — Zustand store for zone CRUD, tile-to-zone lookup
- `src/renderer/src/zones/index.ts` — Module exports
- `src/renderer/src/components/pixi/renderers/ZoneRenderer.ts` — Renders colored semi-transparent rectangles over zone tiles
- `src/renderer/src/zones/zone-store.test.ts` — Unit tests for zone store

### Files to Modify
- `src/renderer/src/components/pixi/World.tsx` — Add ZoneRenderer container, subscribe to zone store changes
- `src/renderer/src/components/pixi/renderers/index.ts` — Export ZoneRenderer
- `src/renderer/src/layers/layer-definitions.ts` — Register zones layer
- `src/renderer/src/agent-api.ts` — Add zone.create, zone.delete, zone.list methods
- `src/renderer/src/agent-api.types.ts` — Add zone API type definitions

### Existing Code to Reuse
- `src/renderer/src/layers/layer-store.ts` — Zustand store pattern for zone store
- `src/renderer/src/components/pixi/renderers/HeatMapRenderer.ts` — Per-tile colored overlay rendering pattern
- `src/renderer/src/game-state/types.ts:SelectableEntityType` — Already has "zone"
- `src/renderer/src/game-state/types.ts:InteractionMode` — Already has "zone"

### Steps
1. Create zone types: ZoneType (stockpile | growing | dumping), ZoneData (id, type, name, zLevel, tiles Set<string>), zone colors map
2. Create ZoneStore with Zustand: zones Map, createZone(), deleteZone(), addTilesToZone(), removeTilesFromZone(), getZoneAtTile()
3. Create ZoneRenderer following HeatMapRenderer pattern — iterate zone tiles, draw colored semi-transparent rectangles
4. Add ZoneRenderer to World.tsx between items layer and heatmap (so zones show under heatmaps)
5. Register "zones" feature layer in layer-definitions.ts
6. Subscribe to zone store changes in World.tsx to trigger re-renders
7. Add zone methods to agent API: zones.create(type, name), zones.delete(id), zones.addTiles(id, tiles), zones.list()
8. Write unit tests for zone store CRUD operations

## Acceptance Criteria
- [ ] Zones can be created, deleted, and have tiles added/removed
- [ ] Zone tiles render as colored overlays on the world map
- [ ] Zones layer is toggleable in the layers panel
- [ ] Agent API can create and manage zones via window.game
- [ ] Unit tests for zone store pass
- [ ] Typecheck and lint pass
