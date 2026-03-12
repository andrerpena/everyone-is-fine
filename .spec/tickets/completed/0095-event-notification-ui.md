# Event Notification UI

**Priority:** medium
**Roadmap Item:** 220
**Created:** 2026-03-12

## Goal
Add toast notifications when events trigger and a persistent banner for active duration-based events (like eclipse), making events clearly visible to the player.

## Context
Events currently only log to the log store. Players may miss important events like wanderers joining or eclipses starting. The toast system already exists (`showToast`) and is used by `GameNotifications` for mental breaks and starvation. Duration-based events need a persistent on-screen indicator showing they're active.

## Plan

### Files to Modify
- `src/renderer/src/simulation/events/event-system.ts` — Add `showToast` calls when events trigger and when duration-based events end
- `src/renderer/src/components/floating/AlertOverlay.tsx` — Add active event banners below the existing alert items

### Existing Code to Reuse
- `components/floating/toast/toastUtils.ts:showToast` — fire toast notifications
- `game-state/index.ts:useGameStore` — subscribe to `simulation.activeEvents`
- `simulation/events/event-definitions.ts:ALL_EVENTS` — look up event labels/descriptions

### Steps
1. Import `showToast` in `event-system.ts` and call it when events fire and when duration-based events end
2. Add an `ActiveEventBanner` component to `AlertOverlay.tsx` that reads `simulation.activeEvents` and renders a banner for each active event
3. Write unit tests for event banner rendering logic (if pure logic can be extracted)

## Acceptance Criteria
- [ ] Toast notification appears when an event triggers (wanderer joins, eclipse starts)
- [ ] Toast notification appears when a duration-based event ends (eclipse ends)
- [ ] Persistent banner shows during active duration-based events
- [ ] Banners display event label and description
