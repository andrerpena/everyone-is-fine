// =============================================================================
// BODY PART SYSTEM
// =============================================================================
// Defines body part types, their properties, and health state tracking.

// =============================================================================
// TYPES
// =============================================================================

/** All body part identifiers */
export type BodyPartId =
  | "head"
  | "torso"
  | "left_arm"
  | "right_arm"
  | "left_leg"
  | "right_leg"
  | "left_hand"
  | "right_hand"
  | "left_foot"
  | "right_foot";

/** Definition for a body part type */
export interface BodyPartDefinition {
  id: BodyPartId;
  label: string;
  /** Maximum health for this body part */
  maxHealth: number;
  /** Whether destruction of this part is fatal */
  vital: boolean;
  /** Parent body part (null = root) */
  parent: BodyPartId | null;
}

/** Runtime state of a single body part */
export interface BodyPartState {
  /** Current health (0 = destroyed, maxHealth = full) */
  health: number;
  /** Maximum health for this body part */
  maxHealth: number;
}

/** All body parts state for a character */
export type BodyPartsState = Record<BodyPartId, BodyPartState>;

// =============================================================================
// BODY PART REGISTRY
// =============================================================================

/** Registry of all body part definitions */
export const BODY_PART_DEFINITIONS: readonly BodyPartDefinition[] = [
  { id: "head", label: "Head", maxHealth: 30, vital: true, parent: null },
  { id: "torso", label: "Torso", maxHealth: 40, vital: true, parent: null },
  {
    id: "left_arm",
    label: "Left Arm",
    maxHealth: 25,
    vital: false,
    parent: "torso",
  },
  {
    id: "right_arm",
    label: "Right Arm",
    maxHealth: 25,
    vital: false,
    parent: "torso",
  },
  {
    id: "left_leg",
    label: "Left Leg",
    maxHealth: 30,
    vital: false,
    parent: "torso",
  },
  {
    id: "right_leg",
    label: "Right Leg",
    maxHealth: 30,
    vital: false,
    parent: "torso",
  },
  {
    id: "left_hand",
    label: "Left Hand",
    maxHealth: 15,
    vital: false,
    parent: "left_arm",
  },
  {
    id: "right_hand",
    label: "Right Hand",
    maxHealth: 15,
    vital: false,
    parent: "right_arm",
  },
  {
    id: "left_foot",
    label: "Left Foot",
    maxHealth: 15,
    vital: false,
    parent: "left_leg",
  },
  {
    id: "right_foot",
    label: "Right Foot",
    maxHealth: 15,
    vital: false,
    parent: "right_leg",
  },
] as const;

/** Map of body part ID to definition for O(1) lookup */
export const BODY_PART_MAP: ReadonlyMap<BodyPartId, BodyPartDefinition> =
  new Map(BODY_PART_DEFINITIONS.map((d) => [d.id, d]));

/**
 * Get a body part definition by ID.
 */
export function getBodyPartDefinition(
  id: BodyPartId,
): BodyPartDefinition | undefined {
  return BODY_PART_MAP.get(id);
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Create default body parts state with all parts at full health.
 */
export function createDefaultBodyParts(): BodyPartsState {
  const parts = {} as BodyPartsState;
  for (const def of BODY_PART_DEFINITIONS) {
    parts[def.id] = {
      health: def.maxHealth,
      maxHealth: def.maxHealth,
    };
  }
  return parts;
}

/**
 * Get the total health percentage across all body parts (0-1).
 */
export function getOverallHealth(bodyParts: BodyPartsState): number {
  let totalHealth = 0;
  let totalMaxHealth = 0;
  for (const def of BODY_PART_DEFINITIONS) {
    const part = bodyParts[def.id];
    totalHealth += part.health;
    totalMaxHealth += part.maxHealth;
  }
  return totalMaxHealth > 0 ? totalHealth / totalMaxHealth : 1;
}
