# Filth and Cleaning System

**Priority:** medium
**Roadmap Item:** 82
**Created:** 2026-03-12

## Goal
Add a filth accumulation and cleaning system so tiles get dirty over time and colonists can clean them, affecting room beauty.

## Context
Rooms track beauty from structures and floors, but there's no cleanliness dimension. Colonists walking around should generate filth (tracked footprints, dirt), which reduces beauty. A cleaning job lets colonists remove filth. This creates a meaningful maintenance loop and makes the environment system richer.

## Plan

### Files to Modify
- `src/renderer/src/world/types.ts` — Add `filth: number` field (0 = clean, increments with dirt) to the `Tile` interface
- `src/renderer/src/simulation/rooms/room-stats.ts` — Factor filth into room beauty calculation as a penalty
- `src/renderer/src/simulation/jobs/job-factory.ts` — Add `createCleanJob` factory (move → work → clear filth)
- `src/renderer/src/simulation/jobs/action-rules.ts` — Add "clean" action rule matching tiles with filth > 0
- `src/renderer/src/simulation/jobs/types.ts` — Add `CleanTileStep` type to JobStep union
- `src/renderer/src/simulation/jobs/job-processor.ts` — Add `executeCleanTile` handler to reset tile filth to 0
- `src/renderer/src/simulation/jobs/index.ts` — Export `createCleanJob` and `CleanTileStep`
- `src/renderer/src/world/factories/procedural-generator.ts` — Initialize `filth: 0` on new tiles

### Files to Create
- `src/renderer/src/simulation/filth-system.ts` — FilthSystem class that runs each tick: when a colonist moves onto a non-natural floor tile, increment filth with a small probability
- `src/renderer/src/simulation/filth-system.test.ts` — Unit tests for filth generation logic

### Existing Code to Reuse
- `src/renderer/src/simulation/jobs/job-factory.ts:createSmoothJob` — Similar simple pattern: move → work → transform tile
- `src/renderer/src/simulation/rooms/room-stats.ts:calculateRoomStats` — Extend beauty calc with filth penalty
- `src/renderer/src/simulation/jobs/job-processor.ts:executePlaceFloor` — Pattern for modifying tile state in a step handler
- `src/renderer/src/simulation/jobs/action-rules.ts` — Declarative rule pattern for auto-assigning cleaning

### Steps
1. Add `filth: number` field to the `Tile` interface in `types.ts`. Initialize to 0 in procedural-generator and any other tile creation points.
2. Create `CleanTileStep` in `types.ts` with `position` field. Add to `JobStep` union.
3. Create `createCleanJob` in `job-factory.ts`: move adjacent → work (120 ticks) → clean_tile step.
4. Add `executeCleanTile` in `job-processor.ts`: set `tile.filth = 0`, notify store.
5. Add "clean" action rule in `action-rules.ts` (priority 3, matches tiles with `filth > 0` that have a floor or are indoors).
6. Create `FilthSystem` class: on each tick, for each moving colonist, if they step onto a tile with a constructed floor, roll a small chance (~2%) to increment `tile.filth` by 1.
7. Integrate filth into `calculateRoomStats`: subtract `averageFilth * 3` from room beauty score.
8. Export new types and factory from `index.ts`.
9. Write unit tests for `FilthSystem` logic and the cleaning job.

## Acceptance Criteria
- [ ] Tiles have a `filth` numeric field initialized to 0
- [ ] FilthSystem increments filth on tiles when colonists move onto floored tiles
- [ ] `createCleanJob` produces a valid 3-step job (move → work → clean_tile)
- [ ] JobProcessor handles `clean_tile` step by resetting filth to 0
- [ ] Room beauty calculation penalizes rooms with filthy tiles
- [ ] "Clean" action rule appears for tiles with filth > 0
- [ ] Unit tests pass for filth generation and cleaning job
