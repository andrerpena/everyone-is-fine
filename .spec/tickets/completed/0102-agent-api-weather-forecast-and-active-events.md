# Agent API: Expose Weather Forecast and Active Events

**Priority:** medium
**Roadmap Item:** developer-initiated
**Created:** 2026-03-12

## Goal
Enhance the `window.game` agent API to expose the weather forecast and active events, enabling browser agents to read current event state and upcoming weather.

## Context
The agent API's `world.weather` currently only exposes `type` and `temperature`. The new `forecast` field (added in v0.94.0) and active events (tracked in simulation state) are not surfaced. Browser agents need this information to make informed decisions.

## Plan

### Files to Modify
- `src/renderer/src/agent-api.ts` — Add `forecast` to the weather object and add `activeEvents` array to the simulation object

### Existing Code to Reuse
- `store.ts` already puts `activeEvents: ReadonlySet<string>` into simulation state
- `world.weather.forecast` is already a `WeatherType` on the world object

### Steps
1. In the `world` property getter, add `forecast` to the weather object
2. In the `simulation` property getter, add `activeEvents` as an array (convert from Set)
3. Run quality gate

## Acceptance Criteria
- [ ] `window.game.world.weather.forecast` returns the forecast weather type
- [ ] `window.game.simulation.activeEvents` returns an array of active event IDs
- [ ] TypeScript compiles cleanly
- [ ] Lint passes
