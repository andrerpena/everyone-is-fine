# Persistent Alert System

**Priority:** medium
**Roadmap Item:** 280
**Created:** 2026-03-12

## Goal
Add a persistent alert system that monitors colony state and displays active alerts on the right side of the screen, complementing the existing toast notifications.

## Context
Toast notifications exist for one-time events (mental breaks, starvation). But RimWorld-style persistent alerts that remain visible as long as a condition is true (e.g., "Colonist starving", "All colonists idle", "Low food") are missing. These provide constant situational awareness.

## Plan

### Files to Create
- `src/renderer/src/alerts/alert-store.ts` — Zustand store that evaluates colony conditions and maintains active alerts
- `src/renderer/src/alerts/alert-definitions.ts` — Alert type definitions and condition checkers
- `src/renderer/src/components/floating/AlertOverlay.tsx` — Fixed-position overlay rendering active alerts

### Files to Modify
- `src/renderer/src/screens/GameScreen.tsx` — Add AlertOverlay component

### Existing Code to Reuse
- `simulation/game-notifications.ts` — Pattern for monitoring entity state
- `simulation/needs/needs-config.ts:getNeedThreshold` — need level checks
- `game-state/index.ts` — accessing entity store and game state

### Steps
1. Create alert definitions with condition functions (starving, exhausted, all idle, mental break active, low food supply)
2. Create alert store that evaluates conditions periodically and maintains active alert set
3. Create AlertOverlay component rendering alerts as a column on the right edge
4. Add AlertOverlay to GameScreen
5. Write tests for alert condition logic

## Acceptance Criteria
- [ ] Persistent alerts appear when conditions are met (starving, exhausted, idle, mental break)
- [ ] Alerts disappear when conditions resolve
- [ ] Alerts render on the right side of the screen without blocking interaction
- [ ] Alert conditions are testable pure functions
