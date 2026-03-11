# Colonist Info Panel Widget

**Priority:** medium
**Roadmap Item:** 33
**Created:** 2026-03-11

## Goal
Create a colonist info panel widget that shows detailed stats for the currently selected colonist, following the TileInspector pattern.

## Context
The game has a Characters list widget (`CharactersWidget`) that shows a table of all colonists with basic columns (name, age, gender, position). However, there is no detail/inspector panel for a single selected colonist. The `TileInspectorWidget` provides an established pattern: use a reactive hook for selection, transform entity data to a schema-compatible format, and render with `InspectorForm`. The `useSelectedCharacter()` hook already exists and returns the full `Character` object with biography, movement, control, and needs data.

## Plan

### Files to Create
- `src/renderer/src/schemas/definitions/colonist-inspector-schema.ts` — Schema defining the colonist info form layout with groups: Identity, Status, Movement, Needs
- `src/renderer/src/components/widgets/definitions/ColonistInfoWidget.tsx` — Widget component using `useSelectedCharacter()` hook and `InspectorForm`

### Files to Modify
- `src/renderer/src/schemas/index.ts` — Export the new colonist inspector schema and its data type
- `src/renderer/src/components/widgets/definitions/index.ts` — Export `colonistInfoWidget`
- `src/renderer/src/components/widgets/register-widgets.ts` — Register `colonistInfoWidget`
- `.spec/roadmap.md` — Check off item 33

### Existing Code to Reuse
- `src/renderer/src/components/widgets/definitions/TileInspectorWidget.tsx` — Pattern to follow exactly (hook → early return → transform → InspectorForm)
- `src/renderer/src/schemas/definitions/tile-inspector-schema.ts` — Pattern for schema with `withFormLayouts` groups
- `src/renderer/src/game-state/hooks/useSimulation.ts:useSelectedCharacter` — Reactive hook returning selected `Character | null`
- `src/renderer/src/components/schema-form/InspectorForm.tsx` — Renders schema-driven form
- `src/renderer/src/schemas/core` — `nu` schema builder

### Steps
1. Create `colonist-inspector-schema.ts` with groups:
   - **Identity**: name (readonly string), age (readonly number), gender (readonly string)
   - **Status**: controlMode (readonly string), currentCommand (readonly string, optional — show command type or "None")
   - **Movement**: position (readonly string), speed (readonly number), isMoving (readonly boolean)
   - **Needs**: hunger (percentage renderer), energy (percentage renderer), mood (percentage renderer)
   - Export a `ColonistInspectorData` interface matching the schema fields
   - Use `withFormLayouts` with a "default" layout organizing fields into groups

2. Create `ColonistInfoWidget.tsx`:
   - Import `useSelectedCharacter` from game-state
   - Early return with "No colonist selected" message if null
   - Transform `Character` to `ColonistInspectorData` (format name with nickname, format position as string, map needs values, etc.)
   - Render using `<InspectorForm schema={colonistInspectorSchema} data={data} layout="default" />`
   - Export widget definition with id `"colonist-info"`, label `"Colonist"`, icon `User` from lucide-react

3. Update `schemas/index.ts` to export the new schema and data type

4. Update `widgets/definitions/index.ts` to export `colonistInfoWidget`

5. Update `register-widgets.ts` to register the widget

6. Run `npm run lint:fix && npm run typecheck` to verify

## Acceptance Criteria
- [ ] Selecting a colonist shows their detailed info in the Colonist Info widget
- [ ] Widget shows identity (name, age, gender), status, movement, and needs data
- [ ] Widget shows "No colonist selected" placeholder when nothing is selected
- [ ] Widget uses InspectorForm with grouped layout matching TileInspector pattern
- [ ] Widget is registered and available in the widget system
- [ ] `npm run typecheck` and `npm run lint:fix` pass cleanly
