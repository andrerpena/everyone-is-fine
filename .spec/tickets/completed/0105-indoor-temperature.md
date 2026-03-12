# Indoor Temperature System

**Priority:** medium
**Roadmap Item:** 141
**Created:** 2026-03-12

## Goal
Implement indoor temperature that differs from outdoor temperature, with roofed rooms providing insulation that moderates extreme temperatures toward a comfortable baseline.

## Context
Currently `world.weather.temperature` is a single global value. The roof system (v0.97.0) marks indoor rooms as roofed. Indoor temperature should be moderated — walls and roofs insulate, keeping interior temperatures closer to a comfortable baseline (20°C). This is the foundation for heaters, coolers, heatstroke, and hypothermia.

## Plan

### Files to Create
- `src/renderer/src/simulation/rooms/indoor-temperature.ts` — Pure function to compute indoor temperature from outdoor temperature with insulation factor

### Files to Modify
- `src/renderer/src/simulation/rooms/room-types.ts` — Add optional `temperature` field to `Room`
- `src/renderer/src/simulation/rooms/room-detection-system.ts` — Compute and store room temperature during update
- `src/renderer/src/simulation/rooms/index.ts` — Export new function
- `src/renderer/src/simulation/index.ts` — Export new function
- `src/renderer/src/agent-api.ts` — Add `temperature` to tile info (indoor temp for roofed tiles, outdoor temp otherwise)
- `src/renderer/src/agent-api.types.ts` — Add `temperature` to AgentTileInfo

### Existing Code to Reuse
- `src/renderer/src/simulation/time/temperature.ts:getOutdoorTemperature` — Outdoor temp calculation
- `src/renderer/src/simulation/rooms/room-detection-system.ts:RoomDetectionSystem` — Has room lookup, runs on interval
- `src/renderer/src/game-state/store.ts` — `world.weather.temperature` is the current outdoor temp

### Steps
1. Create `getIndoorTemperature(outdoorTemp, insulationFactor?)` — lerps outdoor temp toward comfortable baseline (20°C)
2. Add `temperature: number | null` to Room interface
3. After room detection, compute indoor temp for roofed rooms using current outdoor temperature
4. Add `temperature` to agent API tile info
5. Write unit tests for indoor temperature calculation

## Acceptance Criteria
- [ ] `getIndoorTemperature(outdoorTemp)` returns a temperature moderated toward 20°C
- [ ] Indoor rooms store their computed temperature
- [ ] Agent API tile info includes `temperature` (indoor for roofed, outdoor otherwise)
- [ ] Unit tests for indoor temperature formula
- [ ] TypeScript compiles cleanly
- [ ] Lint passes
