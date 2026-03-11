// =============================================================================
// TRAIT SYSTEM
// =============================================================================
// Defines colonist personality traits, types, and generation logic

import type { SeededRandom } from "../world/factories/world-factory";

// =============================================================================
// TRAIT TYPES
// =============================================================================

/** All available trait identifiers */
export type TraitId =
  | "industrious"
  | "lazy"
  | "tough"
  | "wimp"
  | "optimist"
  | "pessimist"
  | "kind"
  | "abrasive"
  | "brave"
  | "cowardly"
  | "iron-willed"
  | "neurotic"
  | "gourmand"
  | "green-thumb"
  | "nimble";

/** Trait category — spectrum traits come in opposing pairs */
export type TraitCategory = "spectrum" | "standalone";

/** A colonist's trait list */
export type CharacterTraits = TraitId[];

// =============================================================================
// TRAIT DEFINITIONS
// =============================================================================

export interface TraitDefinition {
  id: TraitId;
  label: string;
  description: string;
  category: TraitCategory;
  /** Trait IDs that cannot coexist with this trait */
  conflictsWith: TraitId[];
}

/** Registry of all trait definitions */
export const TRAIT_DEFINITIONS: readonly TraitDefinition[] = [
  // Spectrum pairs
  {
    id: "industrious",
    label: "Industrious",
    description: "Works significantly faster than normal",
    category: "spectrum",
    conflictsWith: ["lazy"],
  },
  {
    id: "lazy",
    label: "Lazy",
    description: "Works significantly slower than normal",
    category: "spectrum",
    conflictsWith: ["industrious"],
  },
  {
    id: "tough",
    label: "Tough",
    description: "Takes less damage and shrugs off pain",
    category: "spectrum",
    conflictsWith: ["wimp"],
  },
  {
    id: "wimp",
    label: "Wimp",
    description: "Very sensitive to pain, incapacitated easily",
    category: "spectrum",
    conflictsWith: ["tough"],
  },
  {
    id: "optimist",
    label: "Optimist",
    description: "Naturally higher baseline mood",
    category: "spectrum",
    conflictsWith: ["pessimist"],
  },
  {
    id: "pessimist",
    label: "Pessimist",
    description: "Naturally lower baseline mood",
    category: "spectrum",
    conflictsWith: ["optimist"],
  },
  {
    id: "kind",
    label: "Kind",
    description: "More positive social interactions, never insults",
    category: "spectrum",
    conflictsWith: ["abrasive"],
  },
  {
    id: "abrasive",
    label: "Abrasive",
    description: "Frequently offends others in conversation",
    category: "spectrum",
    conflictsWith: ["kind"],
  },
  {
    id: "brave",
    label: "Brave",
    description: "Less likely to flee combat, higher pain threshold",
    category: "spectrum",
    conflictsWith: ["cowardly"],
  },
  {
    id: "cowardly",
    label: "Cowardly",
    description: "Flees from danger quickly, mood penalty in combat",
    category: "spectrum",
    conflictsWith: ["brave"],
  },
  // Standalone traits
  {
    id: "iron-willed",
    label: "Iron-Willed",
    description: "Very resistant to mental breaks",
    category: "standalone",
    conflictsWith: [],
  },
  {
    id: "neurotic",
    label: "Neurotic",
    description: "Works faster but has lower mood",
    category: "standalone",
    conflictsWith: [],
  },
  {
    id: "gourmand",
    label: "Gourmand",
    description: "Needs more food, gets mood boost from fine meals",
    category: "standalone",
    conflictsWith: [],
  },
  {
    id: "green-thumb",
    label: "Green Thumb",
    description: "Bonus to all plant-related work",
    category: "standalone",
    conflictsWith: [],
  },
  {
    id: "nimble",
    label: "Nimble",
    description: "Better at dodging melee attacks",
    category: "standalone",
    conflictsWith: [],
  },
] as const;

/** All trait IDs as an array for iteration */
export const ALL_TRAIT_IDS: readonly TraitId[] = TRAIT_DEFINITIONS.map(
  (d) => d.id,
);

// =============================================================================
// TRAIT LOGIC
// =============================================================================

/**
 * Check if a trait conflicts with any trait in the given list.
 */
export function hasConflict(
  existingTraits: CharacterTraits,
  traitId: TraitId,
): boolean {
  const def = TRAIT_DEFINITIONS.find((d) => d.id === traitId);
  if (!def) return false;

  return existingTraits.some(
    (existing) => def.conflictsWith.includes(existing) || existing === traitId,
  );
}

/**
 * Generate random traits for a new colonist.
 * Picks 2-4 non-conflicting traits.
 */
export function generateRandomTraits(rng: SeededRandom): CharacterTraits {
  const traitCount = rng.nextInt(2, 5);
  const traits: CharacterTraits = [];

  // Shuffle all trait IDs for random selection
  const shuffled = [...ALL_TRAIT_IDS];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = rng.nextInt(0, i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Pick non-conflicting traits
  for (const traitId of shuffled) {
    if (traits.length >= traitCount) break;
    if (!hasConflict(traits, traitId)) {
      traits.push(traitId);
    }
  }

  return traits;
}

/**
 * Get the definition for a trait by its ID.
 */
export function getTraitDefinition(
  traitId: TraitId,
): TraitDefinition | undefined {
  return TRAIT_DEFINITIONS.find((d) => d.id === traitId);
}

// =============================================================================
// DISPLAY HELPERS
// =============================================================================

/**
 * Format traits as a comma-separated summary string.
 */
export function formatTraitsSummary(traits: CharacterTraits): string {
  if (traits.length === 0) return "None";
  return traits
    .map((id) => {
      const def = getTraitDefinition(id);
      return def?.label ?? id;
    })
    .join(", ");
}
