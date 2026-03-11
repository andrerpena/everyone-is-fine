# Needs Decay System

**Priority:** high
**Roadmap Item:** 44
**Created:** 2026-03-11

## Goal
Implement tick-based decay for colonist needs (hunger, energy, mood) with configurable rates and threshold levels, making colonists require ongoing care.

## Context
Characters already have `needs: CharacterNeeds` with `hunger`, `energy`, and `mood` fields (0-1 range, 1=full). These values are displayed in the Colonist Info widget but never change. Adding decay makes colonists feel alive and creates the foundation for future gameplay (eating, sleeping, mental breaks).

## Plan

### Files to Create
- `src/renderer/src/simulation/needs/needs-system.ts` — NeedsSystem class that decays needs each tick and updates entity store
- `src/renderer/src/simulation/needs/needs-config.ts` — Need definitions with decay rates, thresholds, and labels

### Files to Modify
- `src/renderer/src/simulation/index.ts` — Export needs system
- `src/renderer/src/game-state/store.ts` — Instantiate NeedsSystem and call update() in tick callback

### Existing Code to Reuse
- `src/renderer/src/simulation/behaviors/idle-behavior.ts` — Pattern for a tick-driven system with entity iteration
- `src/renderer/src/simulation/entity-store.ts` — EntityStore.update() for modifying character needs
- `src/renderer/src/simulation/simulation-loop.ts:TICKS_PER_SECOND` — For converting per-second rates to per-tick

### Steps
1. Create `needs-config.ts` with:
   - `NeedId` type: "hunger" | "energy" | "mood"
   - `NeedConfig` interface: { id, label, decayPerSecond, thresholds }
   - `NeedThreshold` type: "satisfied" | "minor" | "major" | "critical"
   - Threshold levels at 0.7, 0.4, 0.2 boundaries
   - Decay rates: hunger ~0.001/s (~17min to empty), energy ~0.0008/s (~21min), mood ~0.0005/s (~33min)
2. Create `needs-system.ts` with:
   - NeedsSystem class taking entityStore
   - `update(deltaTime)` method: iterate all characters, decay each need, clamp to [0,1]
   - `getNeedThreshold(value)` helper returning threshold level
3. Wire NeedsSystem into store.ts tick callback (after idleBehavior, before jobProcessor)
4. Export from simulation/index.ts
5. Run lint:fix + typecheck

## Acceptance Criteria
- [ ] Hunger, energy, and mood decay over time while simulation is running
- [ ] Need values are clamped to [0, 1] range
- [ ] Decay rates are configurable per need type
- [ ] Threshold helper function returns correct level for any value
- [ ] `npm run typecheck` and `npm run lint:fix` pass cleanly
