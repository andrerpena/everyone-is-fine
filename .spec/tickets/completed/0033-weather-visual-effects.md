# Weather Visual Effects

**Priority:** medium
**Roadmap Item:** 138
**Created:** 2026-03-11

## Goal
Add visual particle effects for rain, snow, and storm weather types so the player can see weather changes in-game beyond the status bar text.

## Context
The weather system (ticket 0032) dynamically transitions between weather types, but there are no visual effects — the player only sees the weather label in the status bar. Adding falling rain/snow particles makes weather tangible and atmospheric. Ground moisture effects are deferred to a future ticket.

## Plan

### Files to Create
- `src/renderer/src/components/pixi/renderers/weather-renderer.ts` — Manages particle effects for weather types (rain lines, snow dots). Uses Pixi.js Graphics drawn each frame via app.ticker.

### Files to Modify
- `src/renderer/src/components/pixi/renderers/index.ts` — Export WeatherRenderer
- `src/renderer/src/components/pixi/World.tsx` — Create WeatherRenderer, add container between ambient overlay and hover graphics, subscribe to weather state changes, update particles each frame
- `src/renderer/src/layers/layer-definitions.ts` — Register weather-effects layer definition
- `src/renderer/src/layers/layer-store.ts` — (if needed) ensure new layer auto-initializes

### Existing Code to Reuse
- `src/renderer/src/components/pixi/renderers/ambient-lighting.ts` — Pattern for full-viewport overlay
- `src/renderer/src/components/pixi/World.tsx:CELL_SIZE` — World dimensions
- `src/renderer/src/simulation/weather/weather-system.ts:WeatherSystem` — Weather state source

### Steps
1. Create WeatherRenderer class that manages a Graphics object for particle drawing
2. Implement particle pool: array of {x, y, speed, length} objects recycled each frame
3. For rain: draw short angled lines falling down-left, semi-transparent blue-white
4. For snow: draw small circles drifting slowly, white with slight horizontal sway
5. For storm: same as rain but denser and faster, with darker tint
6. Clear/cloudy/fog/heatwave: no particles (fog could be a subtle overlay but defer)
7. Add to World.tsx: create container, instantiate renderer, add ticker callback for animation
8. Register weather-effects feature layer in layer-definitions.ts
9. Subscribe to weather.type changes to update renderer active state

## Acceptance Criteria
- [ ] Rain shows falling blue-white line particles
- [ ] Snow shows falling white dot particles
- [ ] Storm shows dense, fast rain particles
- [ ] Clear/cloudy/fog/heatwave show no particles
- [ ] Weather layer toggleable in layers panel
- [ ] Typecheck and lint pass
