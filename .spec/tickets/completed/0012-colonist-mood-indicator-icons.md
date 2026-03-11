# Colonist Mood Indicator Icons on World Sprites

**Priority:** medium
**Roadmap Item:** 58
**Created:** 2026-03-11

## Goal
Add a small colored mood indicator above each colonist sprite on the world map, so players can see at a glance how colonists are feeling without selecting them.

## Context
The mood thought system (ticket 0011) computes mood as a 0-1 value from active thoughts. Currently, mood is only visible in the ColonistInfoWidget when a colonist is selected. Adding a visual indicator on the world map sprites makes mood information immediately visible during gameplay, similar to how the job indicator dot already works.

## Plan

### Files to Modify
- `src/renderer/src/components/pixi/renderers/CharacterRenderer.ts` — Add a mood indicator graphic to each character's container, update it each frame based on mood value

### Existing Code to Reuse
- `CharacterRenderer.ts:drawJobIndicator` — Same pattern: a small graphic positioned above the character, toggled by state
- `CharacterRenderer.ts:CharacterGraphics` interface — Add `moodIndicator: Graphics` field
- `Character.needs.mood` — The mood value (0-1) from the thought system
- `ResolvedGameColors` — May need mood-related colors added

### Files to Potentially Modify
- `src/renderer/src/theming/game-color-tokens.ts` or equivalent — Add mood indicator colors if not already present
- `src/renderer/src/theming/game-color-store.ts` — Expose mood colors in resolved colors

### Steps
1. Add a `moodIndicator` Graphics to the `CharacterGraphics` interface and create it in `createCharacterGraphics`
2. Create a `drawMoodIndicator(graphics: Graphics, mood: number)` method that:
   - Draws a small colored circle/dot offset from the character (opposite side from job indicator, e.g., left side or below)
   - Color-codes by mood threshold: green for happy (>0.65), yellow for neutral (0.35-0.65), orange for low (0.15-0.35), red for critical (<0.15)
   - Only shows if mood is notably bad (< 0.5) to avoid visual clutter when things are fine. Or always shows a subtle indicator — use judgment for best UX
3. Call `drawMoodIndicator` in `updateCharacterGraphics` passing `character.needs.mood`
4. Update the `update()` method signature if needed (Character already passed through, so mood is accessible)
5. Add mood indicator colors to the theme system if needed
6. Write a simple unit test for mood-to-color mapping logic if extracted as a pure function

## Acceptance Criteria
- [ ] Each colonist on the world map shows a mood indicator near their sprite
- [ ] The indicator color changes based on mood value (at least 3 tiers: good/neutral/bad)
- [ ] The indicator updates in real-time as mood changes
- [ ] Visual is subtle enough not to clutter the map but informative enough to be useful
- [ ] Lint and typecheck pass
