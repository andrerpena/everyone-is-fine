# Game Time Status Bar Display

**Priority:** medium
**Roadmap Item:** developer-initiated
**Created:** 2026-03-11

## Goal
Display the current in-game time (day, hour:minute, season, year) in the status bar so players can see time passing at a glance.

## Context
Ticket 0014 added the time progression system but there's no visible time display in the UI. The status bar already has version, theme, run-command, and FPS items. Adding a game time item makes the time system tangible and is foundational for features that depend on time awareness (schedules, day/night).

## Plan

### Files to Create
- `src/renderer/src/components/status-bars/definitions/GameTimeStatusBar.tsx` — Status bar component showing formatted game time

### Files to Modify
- `src/renderer/src/config/registry-ids.ts` — Add "game-time" to STATUS_BAR_IDS
- `src/renderer/src/components/status-bars/definitions/index.ts` — Export new component
- `src/renderer/src/components/status-bars/register-status-bars.ts` — Register the new item

### Existing Code to Reuse
- `formatGameTime()` from `simulation/time` — formats WorldTime as "Day 1, 08:00, Spring Year 1"
- `useGameStore` — subscribe to `world.time` for reactive updates
- `StatusBarButton` — reusable status bar display component
- `VersionStatusBar.tsx` — pattern to follow

### Steps
1. Add "game-time" to STATUS_BAR_IDS in registry-ids.ts
2. Create GameTimeStatusBar component that reads world.time from the game store and formats it
3. Export from definitions/index.ts
4. Register in register-status-bars.ts with left alignment, priority 90 (before version at 100)

## Acceptance Criteria
- [ ] Game time appears in the left side of the status bar
- [ ] Time updates reactively as simulation ticks advance
- [ ] Shows "Day N, HH:MM, Season Year N" format
- [ ] Shows placeholder when no world is loaded
- [ ] Lint and typecheck pass
