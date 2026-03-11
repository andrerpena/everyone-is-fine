# Trait System

**Priority:** medium
**Roadmap Item:** 39
**Created:** 2026-03-11

## Goal
Add a personality trait system so colonists have unique traits that affect their behavior, stats, and provide character differentiation.

## Context
Colonists currently have identity (name, age, gender), skills with passions, and needs. Traits are a core RimWorld mechanic — personality attributes like "Industrious", "Lazy", "Tough", "Neurotic" that modify various stats and make each colonist unique. This is foundational for many future systems (mood thoughts, social interactions, work preferences).

## Plan

### Files to Create
- `src/renderer/src/simulation/traits.ts` — Trait type definitions, trait registry, generation logic, and stat modifier helpers

### Files to Modify
- `src/renderer/src/simulation/types.ts` — Add `traits` field to Character interface, update `createCharacter()`
- `src/renderer/src/simulation/colonist-generator.ts` — Add trait generation to `generateColonistIdentity()`
- `src/renderer/src/simulation/entity-store.ts` — Add traits to `mergeCharacter()` deep merge
- `src/renderer/src/simulation/index.ts` — Export trait types and functions
- `src/renderer/src/schemas/definitions/colonist-inspector-schema.ts` — Add traits display field
- `src/renderer/src/components/widgets/definitions/ColonistInfoWidget.tsx` — Pass traits to inspector

### Existing Code to Reuse
- `src/renderer/src/simulation/skills.ts` — Pattern for type definitions, registry, and generation
- `src/renderer/src/world/factories/world-factory.ts:SeededRandom` — RNG for trait assignment

### Steps
1. Create `traits.ts` with:
   - `TraitId` union type for ~15 starter traits
   - `TraitCategory` type: "spectrum" (paired opposites) or "standalone"
   - `TraitDefinition` interface: id, label, description, category, conflictsWith (trait IDs that can't coexist)
   - `TRAIT_DEFINITIONS` registry array
   - `ALL_TRAIT_IDS` constant
   - `CharacterTraits` type as `TraitId[]` (simple array — traits are either present or not)
   - `generateRandomTraits(rng)` — Pick 2-4 random non-conflicting traits
   - `hasConflict(traits, traitId)` — Check if adding a trait would conflict
   - `formatTraitsSummary(traits)` — Display string with labels
2. Add `traits: CharacterTraits` to Character interface in types.ts, default to `[]`
3. Update `generateColonistIdentity()` to call `generateRandomTraits(rng)` and return traits
4. Update `mergeCharacter()` in entity-store to handle traits (replace, not merge — it's an array)
5. Add traits field to colonist inspector schema and widget
6. Export new types from index.ts
7. Write unit tests for trait generation and conflict checking
8. Run lint:fix + typecheck

### Starter Traits (~15)
Spectrum pairs (can't have both):
- Industrious / Lazy (work speed modifier)
- Tough / Wimp (pain threshold)
- Optimist / Pessimist (mood baseline)
- Kind / Abrasive (social interaction)
- Brave / Cowardly (combat behavior)

Standalone:
- Iron-Willed (mental break threshold)
- Neurotic (work speed + mood penalty)
- Gourmand (food consumption)
- Green Thumb (plant work bonus)
- Nimble (melee dodge)

## Acceptance Criteria
- [ ] `TraitId` type with ~15 traits defined
- [ ] `TRAIT_DEFINITIONS` registry with labels, descriptions, and conflicts
- [ ] `generateRandomTraits` assigns 2-4 non-conflicting traits per colonist
- [ ] Character interface includes `traits` field
- [ ] Colonist generator assigns traits during creation
- [ ] Colonist inspector shows traits
- [ ] Unit tests for generation and conflict logic
- [ ] `npm run typecheck` and `npm run lint:fix` pass cleanly
