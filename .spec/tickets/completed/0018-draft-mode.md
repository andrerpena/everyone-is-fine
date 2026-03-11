# Draft Mode: Direct Colonist Control

**Priority:** medium
**Roadmap Item:** 85
**Created:** 2026-03-11

## Goal
Add a "drafted" control mode so colonists stop all auto-behaviors and only respond to direct player commands.

## Context
Colonists currently auto-wander, can trigger mental breaks, and have no way to be directly controlled for specific tasks. Draft mode is essential for micromanagement scenarios (combat, positioning). The existing `ControlMode` type already supports multiple modes (`idle`, `imperative`, `scheduled`), making this a natural extension.

## Plan

### Files to Modify
- `src/renderer/src/simulation/types.ts` — Add `"drafted"` to ControlMode union
- `src/renderer/src/simulation/behaviors/mental-break-system.ts` — Skip drafted characters in update()
- `src/renderer/src/game-state/store.ts` — Add draftCharacter/undraftCharacter actions
- `src/renderer/src/game-state/types.ts` — Add draft/undraft to GameStore interface
- `src/renderer/src/components/pixi/renderers/CharacterRenderer.ts` — Add draft visual indicator
- `src/renderer/src/agent-api.ts` — Add draft/undraft API methods
- `src/renderer/src/agent-api.types.ts` — Add isDrafted field and draft methods

### Existing Code to Reuse
- `src/renderer/src/simulation/behaviors/idle-behavior.ts` — Already skips non-idle modes (line 78)
- `src/renderer/src/simulation/behaviors/mental-break-system.ts` — Pattern for cancelling jobs/movement
- `src/renderer/src/components/pixi/renderers/CharacterRenderer.ts:getMoodIndicatorColor` — Pattern for visual indicators

### Steps
1. Extend ControlMode with "drafted" in types.ts
2. Add draft guard in mental-break-system.ts update() to skip drafted characters
3. Add draftCharacter/undraftCharacter actions to game store (cancel active jobs/movement when drafting)
4. Add draft visual indicator in CharacterRenderer (golden outline)
5. Expose isDrafted in agent API types, add draft/undraft methods
6. Write unit tests for draft behavior

## Acceptance Criteria
- [ ] Drafted colonists don't wander (idle behavior skips them)
- [ ] Drafted colonists don't trigger mental breaks
- [ ] Drafted colonists can still receive direct move commands
- [ ] Draft/undraft available via agent API (window.game.draft/undraft)
- [ ] Visual indicator shows drafted state on world sprite
- [ ] Undrafting returns colonist to idle mode
