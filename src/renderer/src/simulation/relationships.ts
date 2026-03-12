// =============================================================================
// RELATIONSHIP SYSTEM
// =============================================================================
// Pure functions for managing opinion scores between colonist pairs.
// Opinion ranges from -100 (hostile) to +100 (best friend).

import type { Character, EntityId } from "./types";

// =============================================================================
// CONSTANTS
// =============================================================================

/** Minimum opinion value */
export const OPINION_MIN = -100;

/** Maximum opinion value */
export const OPINION_MAX = 100;

/** Opinion change from a successful social interaction */
export const SOCIALIZE_OPINION_GAIN = 5;

/** Minimum mutual opinion for romance to form */
export const ROMANCE_OPINION_THRESHOLD = 75;

/** Opinion below which a romantic relationship breaks */
export const BREAKUP_OPINION_THRESHOLD = 20;

/** Minimum mutual opinion for a marriage proposal */
export const MARRIAGE_OPINION_THRESHOLD = 85;

// =============================================================================
// RELATIONSHIP LABELS
// =============================================================================

export type RelationshipLabel =
  | "rival"
  | "disliked"
  | "neutral"
  | "acquaintance"
  | "friend"
  | "close friend"
  | "lover";

/** Thresholds for relationship labels (opinion >= threshold) */
const LABEL_THRESHOLDS: Array<{ min: number; label: RelationshipLabel }> = [
  { min: 60, label: "close friend" },
  { min: 30, label: "friend" },
  { min: 10, label: "acquaintance" },
  { min: -20, label: "neutral" },
  { min: -60, label: "disliked" },
  { min: OPINION_MIN, label: "rival" },
];

// =============================================================================
// FUNCTIONS
// =============================================================================

/** Get the opinion one character has of another (0 if no relationship exists) */
export function getOpinion(
  relationships: Record<EntityId, number>,
  targetId: EntityId,
): number {
  return relationships[targetId] ?? 0;
}

/** Adjust opinion by a delta, clamping to [OPINION_MIN, OPINION_MAX] */
export function adjustOpinion(
  relationships: Record<EntityId, number>,
  targetId: EntityId,
  delta: number,
): Record<EntityId, number> {
  const current = relationships[targetId] ?? 0;
  const newValue = Math.max(
    OPINION_MIN,
    Math.min(OPINION_MAX, current + delta),
  );
  return { ...relationships, [targetId]: newValue };
}

/** Get a human-readable label for an opinion value */
export function getRelationshipLabel(
  opinion: number,
  isPartner = false,
): RelationshipLabel {
  if (isPartner) return "lover";
  for (const { min, label } of LABEL_THRESHOLDS) {
    if (opinion >= min) return label;
  }
  return "rival";
}

/** Check if two characters can form a romance */
export function canFormRomance(a: Character, b: Character): boolean {
  if (a.partner !== null || b.partner !== null) return false;
  const aOpinion = getOpinion(a.relationships, b.id);
  const bOpinion = getOpinion(b.relationships, a.id);
  return (
    aOpinion >= ROMANCE_OPINION_THRESHOLD &&
    bOpinion >= ROMANCE_OPINION_THRESHOLD
  );
}

/** Check if a partnered character should break up (either opinion below threshold) */
export function shouldBreakUp(a: Character, b: Character): boolean {
  const aOpinion = getOpinion(a.relationships, b.id);
  const bOpinion = getOpinion(b.relationships, a.id);
  return (
    aOpinion < BREAKUP_OPINION_THRESHOLD || bOpinion < BREAKUP_OPINION_THRESHOLD
  );
}
