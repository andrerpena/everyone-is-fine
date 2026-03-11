# Expose Full Character Info in Agent API

**Priority:** high
**Roadmap Item:** developer-initiated
**Created:** 2026-03-11

## Goal
Extend the `window.game` agent API to expose biography, traits, skills, and thoughts for each character, enabling agents to fully inspect colonist state.

## Context
The guiding principles state: "Everything you do should be testable by an agent." Currently `AgentCharacterInfo` only exposes `id, name, type, position, isMoving, currentCommand, needs`. Recently added systems (biography, traits, skills with passions, mood thoughts) are invisible to agents. This makes it impossible for browser agents to verify or interact with these systems.

## Plan

### Files to Modify
- `src/renderer/src/agent-api.types.ts` — Add biography, traits, skills, and thoughts fields to `AgentCharacterInfo`
- `src/renderer/src/agent-api.ts` — Update `toAgentCharacter()` to include the new fields

### Existing Code to Reuse
- `Character.biography` — `{ age, gender, firstName, lastName, nickname }`
- `Character.traits` — `TraitId[]`
- `Character.skills` — `CharacterSkills` (Record of SkillData with level, experience, passion)
- `Character.thoughts` — `ActiveThought[]` with thoughtId, addedAtTick, expiresAtTick
- `getThoughtDefinition()` — Can resolve thought labels for more readable output

### Steps
1. Add new interfaces/fields to `AgentCharacterInfo` in `agent-api.types.ts`:
   - `biography: { age, gender, firstName, lastName, nickname }`
   - `traits: string[]`
   - `skills: Record<string, { level, experience, passion }>`
   - `thoughts: Array<{ id, label, moodEffect }>`
2. Update `toAgentCharacter()` in `agent-api.ts` to populate the new fields
3. Keep the data as plain objects (no class instances) for agent-friendliness

## Acceptance Criteria
- [ ] `window.game.characters[0].biography` returns age, gender, name components
- [ ] `window.game.characters[0].traits` returns array of trait IDs
- [ ] `window.game.characters[0].skills` returns skill data with levels, XP, and passion
- [ ] `window.game.characters[0].thoughts` returns active thoughts with labels and mood effects
- [ ] Lint and typecheck pass
