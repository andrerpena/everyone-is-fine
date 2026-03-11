# Colonist Identity: Age, Gender, and Name Generator

**Priority:** high
**Roadmap Item:** 26, 37
**Created:** 2026-03-11

## Goal
Enrich the colonist Character entity with age, gender, and biographical identity, and replace hardcoded names with a procedural name generator using the existing SeededRandom system.

## Context
Characters currently have a `name` field but no age, gender, or generated identity. Colonists are hardcoded as "Alice", "Bob", "Charlie". A colony sim needs colonists with distinct identities — age and gender affect future systems (social, health, traits, sprite selection) and make the game feel alive. The name generator is a natural companion since it uses the same identity data (gender) to produce appropriate names.

## Plan

### Files to Modify
- `src/renderer/src/simulation/types.ts` — Add `age`, `gender`, and `biography` fields to the `Character` interface; update `createCharacter` factory function
- `src/renderer/src/screens/GameScreen.tsx` — Replace hardcoded `COLONIST_NAMES` with the name generator; pass age/gender to `createCharacter`
- `src/renderer/src/components/widgets/definitions/CharactersWidget.tsx` — Display age and gender columns in the characters list
- `src/renderer/src/schemas/index.ts` (or wherever `characterSchema` is defined) — Add age/gender fields to the schema
- `src/renderer/src/simulation/entity-store.ts` — Update `mergeCharacter` to handle new nested `biography` field

### Files to Create
- `src/renderer/src/simulation/colonist-generator.ts` — Name generator with first/nickname/last name pools, and age/gender randomization using SeededRandom

### Existing Code to Reuse
- `src/renderer/src/world/factories/world-factory.ts:SeededRandom` — Deterministic RNG for reproducible colonist generation
- `src/renderer/src/simulation/types.ts:createCharacter` — Factory function to extend with new fields
- `src/renderer/src/simulation/types.ts:generateEntityId` — ID generation pattern

### Steps
1. Add `Gender` type (`"male" | "female"`) and `CharacterBiography` interface (`{ age: number; gender: Gender; firstName: string; nickname: string | null; lastName: string }`) to `simulation/types.ts`. Add `biography` field to `Character` interface.
2. Create `colonist-generator.ts` with:
   - Name pools: ~30 first names per gender, ~20 last names, ~15 nicknames
   - `generateColonistIdentity(rng: SeededRandom)` function that returns `{ name: string; biography: CharacterBiography }`
   - Name format: "FirstName 'Nickname' LastName" (nickname is optional, ~40% chance)
   - Age range: 18-65 (weighted toward 20-40)
   - Gender: 50/50 random
3. Update `createCharacter` in `types.ts` to accept and default `biography` field.
4. Update `GameScreen.tsx` to use `generateColonistIdentity` instead of hardcoded names. Create a SeededRandom from the world seed for deterministic colonist generation.
5. Update `mergeCharacter` in `entity-store.ts` to deep-merge the `biography` field.
6. Update `characterSchema` and `CharactersWidget` to show age and gender in the colonist list.
7. Run `npm run lint:fix && npm run typecheck` to verify.

## Acceptance Criteria
- [ ] Character interface has `biography` with age, gender, firstName, nickname, lastName
- [ ] Colonists spawn with procedurally generated names and identities using SeededRandom
- [ ] Same world seed produces the same colonist identities every time
- [ ] Characters widget displays age and gender columns
- [ ] All existing functionality (movement, selection, commands) continues to work
- [ ] `npm run typecheck` and `npm run lint:fix` pass
