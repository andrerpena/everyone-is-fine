# Fog of War

**Priority:** medium
**Roadmap Item:** 19
**Created:** 2026-03-11

## Goal
Add fog of war rendering so unexplored tiles are hidden in darkness and explored-but-not-visible tiles are dimmed.

## Context
TileVisibility (explored, visible, lightLevel) exists in every tile's data structure but is never computed or rendered. All tiles default to explored=false, visible=false, lightLevel=0. We need both a simulation system that updates visibility based on colonist positions and a renderer that darkens tiles accordingly. Vision is simple radius-based (no raycasting needed for now).

## Plan

### Files to Create
- `src/renderer/src/simulation/vision/vision-system.ts` — Tick-based system that updates tile visibility flags based on colonist positions
- `src/renderer/src/simulation/vision/vision-system.test.ts` — Tests for vision computation
- `src/renderer/src/components/pixi/renderers/FogOfWarRenderer.ts` — Pixi.js renderer that darkens tiles based on visibility state

### Files to Modify
- `src/renderer/src/layers/layer-definitions.ts` — Register fog of war layer definition
- `src/renderer/src/components/pixi/World.tsx` — Instantiate FogOfWarRenderer and wire to visibility updates
- `src/renderer/src/game-state/store.ts` — Add VisionSystem to tick loop

### Existing Code to Reuse
- `src/renderer/src/components/pixi/renderers/ZoneRenderer.ts` — Pattern for overlay renderer with Graphics
- `src/renderer/src/components/pixi/renderers/ambient-lighting.ts` — Pattern for full-world overlay
- `src/renderer/src/simulation/entity-store.ts` — Access colonist positions
- `src/renderer/src/world/types.ts:TileVisibility` — Existing data structure

### Steps
1. Create VisionSystem:
   - Runs every 30 ticks (~0.5s at 60 TPS)
   - For each colonist, mark tiles within sight radius (12 tiles) as visible=true and explored=true
   - Reset all tiles to visible=false before each update, then re-mark visible tiles
   - Explored stays true permanently once set

2. Create FogOfWarRenderer:
   - Follow ZoneRenderer pattern (Graphics-based overlay)
   - Unexplored tiles: black rectangle at 0.85 alpha
   - Explored but not visible: black rectangle at 0.4 alpha
   - Visible tiles: no overlay

3. Register fog-of-war feature layer (zIndex 54, between items and ambient lighting)

4. Wire into World.tsx and game-state/store.ts

## Acceptance Criteria
- [ ] Unexplored tiles are rendered as near-black
- [ ] Explored but not-visible tiles are dimmed
- [ ] Visible tiles (near colonists) are fully lit
- [ ] Exploration is permanent (tiles stay explored)
- [ ] Fog of war can be toggled via layer system
- [ ] All tests pass, lint:fix and typecheck clean
