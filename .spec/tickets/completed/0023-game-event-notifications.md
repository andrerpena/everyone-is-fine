# Game Event Notifications: Toast Alerts for Key Colonist Events

**Priority:** medium
**Roadmap Item:** developer-initiated (foundational for items 87, 220, 280)
**Created:** 2026-03-11

## Goal
Show toast notifications when key game events occur (mental breaks, starvation), making the simulation feel alive and keeping the player informed.

## Context
The toast system (`showToast` from toastUtils.ts) is production-ready and globally accessible. Game events happen silently — colonists enter mental breaks, become starving, etc. with no player notification. Adding toasts for critical events bridges this gap. We start with a small, focused set of events to avoid notification fatigue.

## Plan

### Files to Create
- `src/renderer/src/simulation/game-notifications.ts` — Thin module that tracks entity state changes and fires toasts. Runs each tick, compares previous vs current state, fires toast on transitions.

### Files to Modify
- `src/renderer/src/game-state/store.ts` — Call gameNotifications.update() in the tick callback after state sync
- `src/renderer/src/simulation/index.ts` — Export GameNotifications

### Existing Code to Reuse
- `src/renderer/src/components/floating/toast/toastUtils.ts:showToast` — Fire toasts from non-React code
- `src/renderer/src/simulation/entity-store.ts` — Iterate characters, read needs and mental break state

### Steps
1. Create GameNotifications class that:
   - Tracks previous mental break state per character (Map<EntityId, MentalBreakType | null>)
   - Tracks previous hunger threshold per character (Map<EntityId, NeedThreshold>)
   - On update(), detects transitions and calls showToast():
     - Mental break started: "[Name] is having a mental break: [type]!" (error toast, 5s)
     - Mental break ended: "[Name] has recovered from their mental break." (default toast, 3s)
     - Hunger became critical: "[Name] is starving!" (error toast, 5s)
2. Integrate into store.ts tick callback (after state sync, throttled to run every 60 ticks = 1/sec)
3. Export from simulation/index.ts

## Acceptance Criteria
- [ ] Toast appears when a colonist enters a mental break
- [ ] Toast appears when a mental break ends
- [ ] Toast appears when hunger reaches critical threshold
- [ ] Notifications use colonist's display name
- [ ] Notifications are throttled (not every tick)
- [ ] No toast spam — only fires on state transitions
