// =============================================================================
// INJURY SYSTEM
// =============================================================================
// Defines injury types, damage application, and natural healing.

import type { BodyPartId, BodyPartsState } from "./body-parts";

// =============================================================================
// TYPES
// =============================================================================

/** All injury type identifiers */
export type InjuryTypeId =
  | "cut"
  | "bruise"
  | "gunshot"
  | "burn"
  | "bite"
  | "scratch"
  | "crush";

/** Definition for an injury type */
export interface InjuryDefinition {
  id: InjuryTypeId;
  label: string;
  description: string;
  /** Base damage dealt to the body part */
  baseDamage: number;
  /** Heal rate per tick (fraction of healProgress gained per tick) */
  healRatePerTick: number;
}

/** A specific injury on a body part */
export interface Injury {
  /** Unique identifier for this injury instance */
  id: string;
  /** Type of injury */
  typeId: InjuryTypeId;
  /** Which body part is injured */
  bodyPartId: BodyPartId;
  /** Damage this injury dealt */
  damage: number;
  /** Healing progress (0 = fresh, 1 = fully healed) */
  healProgress: number;
}

// =============================================================================
// INJURY REGISTRY
// =============================================================================

/** Registry of all injury type definitions */
export const INJURY_DEFINITIONS: readonly InjuryDefinition[] = [
  {
    id: "cut",
    label: "Cut",
    description: "A slashing wound that bleeds",
    baseDamage: 8,
    healRatePerTick: 0.00015,
  },
  {
    id: "bruise",
    label: "Bruise",
    description: "Blunt force trauma causing swelling",
    baseDamage: 4,
    healRatePerTick: 0.0003,
  },
  {
    id: "gunshot",
    label: "Gunshot",
    description: "A bullet wound causing severe damage",
    baseDamage: 15,
    healRatePerTick: 0.00008,
  },
  {
    id: "burn",
    label: "Burn",
    description: "Thermal damage to tissue",
    baseDamage: 10,
    healRatePerTick: 0.0001,
  },
  {
    id: "bite",
    label: "Bite",
    description: "A puncture wound from teeth or mandibles",
    baseDamage: 7,
    healRatePerTick: 0.00012,
  },
  {
    id: "scratch",
    label: "Scratch",
    description: "A shallow surface wound",
    baseDamage: 3,
    healRatePerTick: 0.0005,
  },
  {
    id: "crush",
    label: "Crush",
    description: "Heavy blunt force causing deep tissue damage",
    baseDamage: 12,
    healRatePerTick: 0.00009,
  },
] as const;

/** Map of injury type ID to definition for O(1) lookup */
export const INJURY_MAP: ReadonlyMap<InjuryTypeId, InjuryDefinition> = new Map(
  INJURY_DEFINITIONS.map((d) => [d.id, d]),
);

/**
 * Get an injury definition by ID.
 */
export function getInjuryDefinition(
  id: InjuryTypeId,
): InjuryDefinition | undefined {
  return INJURY_MAP.get(id);
}

// =============================================================================
// INJURY APPLICATION
// =============================================================================

let nextInjuryId = 1;

/**
 * Apply an injury to a body part. Reduces the body part's health and adds the
 * injury to its injuries list. Returns the created injury.
 *
 * Body part health is clamped to a minimum of 0.
 */
export function applyInjury(
  bodyParts: BodyPartsState,
  bodyPartId: BodyPartId,
  injuryTypeId: InjuryTypeId,
): Injury {
  const def = INJURY_MAP.get(injuryTypeId);
  if (!def) {
    throw new Error(`Unknown injury type: ${injuryTypeId}`);
  }

  const part = bodyParts[bodyPartId];
  const damage = def.baseDamage;

  // Reduce health, clamped to 0
  part.health = Math.max(0, part.health - damage);

  // Create the injury
  const injury: Injury = {
    id: `injury_${nextInjuryId++}`,
    typeId: injuryTypeId,
    bodyPartId,
    damage,
    healProgress: 0,
  };

  part.injuries.push(injury);
  return injury;
}

// =============================================================================
// NATURAL HEALING
// =============================================================================

/**
 * Advance natural healing for all injuries across all body parts.
 * Injuries that reach healProgress >= 1 are removed and their damage
 * is restored to the body part's health.
 */
export function naturalHealing(
  bodyParts: BodyPartsState,
  deltaTicks: number,
): void {
  for (const partId of Object.keys(bodyParts) as BodyPartId[]) {
    const part = bodyParts[partId];
    const healed: Injury[] = [];
    const remaining: Injury[] = [];

    for (const injury of part.injuries) {
      const def = INJURY_MAP.get(injury.typeId);
      if (!def) {
        remaining.push(injury);
        continue;
      }

      injury.healProgress = Math.min(
        1,
        injury.healProgress + def.healRatePerTick * deltaTicks,
      );

      if (injury.healProgress >= 1) {
        healed.push(injury);
      } else {
        remaining.push(injury);
      }
    }

    // Restore health for healed injuries
    for (const injury of healed) {
      part.health = Math.min(part.maxHealth, part.health + injury.damage);
    }

    part.injuries = remaining;
  }
}
