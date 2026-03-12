# Social Tab Showing Relationships for Selected Colonist

**Priority:** medium
**Roadmap Item:** 154
**Created:** 2026-03-12

## Goal
Display a "Relationships" section in the colonist inspector panel showing opinion scores and labels for all known colonists.

## Context
The relationship system tracks opinion scores between colonist pairs and derives labels (rival, friend, etc.), but this information is not visible in the UI. Adding a "Relationships" group to the colonist inspector makes social dynamics visible to the player.

## Plan

### Files to Modify
- `src/renderer/src/schemas/definitions/colonist-inspector-schema.ts` — Add `relationships` field and layout group
- `src/renderer/src/components/widgets/definitions/ColonistInfoWidget.tsx` — Transform character relationships into display string

### Existing Code to Reuse
- `src/renderer/src/simulation/relationships.ts:getRelationshipLabel` — Convert opinion to label
- `src/renderer/src/simulation/relationships.ts:getOpinion` — Get opinion score
- `src/renderer/src/game-state/store.ts:useGameStore` — Access all characters for name lookup

### Steps
1. Add `relationships` field to the schema with readonly renderer
2. Add "Relationships" group to the layout after "Traits"
3. In ColonistInfoWidget, format each relationship as "Name: Label (opinion)" and join with newline/comma
4. Look up character names from the entity store for display

## Acceptance Criteria
- [ ] Relationships section visible in colonist inspector when a colonist is selected
- [ ] Each relationship shows the other colonist's name, label, and opinion score
- [ ] Empty relationships show "No relationships" placeholder
- [ ] Quality gate passes (lint:fix + typecheck)
