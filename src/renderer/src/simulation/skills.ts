// =============================================================================
// SKILL SYSTEM
// =============================================================================
// Defines colonist skills, types, and generation logic

import type { SeededRandom } from "../world/factories/world-factory";

// =============================================================================
// SKILL TYPES
// =============================================================================

/** All available skill identifiers */
export type SkillId =
  | "shooting"
  | "melee"
  | "construction"
  | "mining"
  | "cooking"
  | "plants"
  | "animals"
  | "crafting"
  | "medicine"
  | "social"
  | "artistic"
  | "intellectual";

/** Data for a single skill */
export interface SkillData {
  /** Current skill level (0-20) */
  level: number;
  /** Experience points toward next level */
  experience: number;
}

/** All skills for a character */
export type CharacterSkills = Record<SkillId, SkillData>;

// =============================================================================
// SKILL DEFINITIONS
// =============================================================================

export interface SkillDefinition {
  id: SkillId;
  label: string;
  description: string;
}

/** Registry of all skill definitions with display metadata */
export const SKILL_DEFINITIONS: readonly SkillDefinition[] = [
  {
    id: "shooting",
    label: "Shooting",
    description: "Ranged weapon accuracy and damage",
  },
  { id: "melee", label: "Melee", description: "Close combat skill and damage" },
  {
    id: "construction",
    label: "Construction",
    description: "Building speed and quality",
  },
  {
    id: "mining",
    label: "Mining",
    description: "Rock and ore extraction speed",
  },
  {
    id: "cooking",
    label: "Cooking",
    description: "Meal preparation speed and quality",
  },
  {
    id: "plants",
    label: "Plants",
    description: "Crop planting, harvesting, and yield",
  },
  {
    id: "animals",
    label: "Animals",
    description: "Taming, training, and handling animals",
  },
  {
    id: "crafting",
    label: "Crafting",
    description: "Item crafting speed and quality",
  },
  {
    id: "medicine",
    label: "Medicine",
    description: "Medical treatment effectiveness",
  },
  {
    id: "social",
    label: "Social",
    description: "Trade prices and recruitment chance",
  },
  {
    id: "artistic",
    label: "Artistic",
    description: "Art creation speed and beauty",
  },
  {
    id: "intellectual",
    label: "Intellectual",
    description: "Research speed and learning rate",
  },
] as const;

/** All skill IDs as an array for iteration */
export const ALL_SKILL_IDS: readonly SkillId[] = SKILL_DEFINITIONS.map(
  (d) => d.id,
);

/** Maximum skill level */
export const MAX_SKILL_LEVEL = 20;

// =============================================================================
// SKILL CREATION
// =============================================================================

/** Create a default skills record with all skills at level 0 */
export function createDefaultSkills(): CharacterSkills {
  const skills = {} as CharacterSkills;
  for (const id of ALL_SKILL_IDS) {
    skills[id] = { level: 0, experience: 0 };
  }
  return skills;
}

/**
 * Generate random starting skills for a new colonist.
 * Most skills are low (0-3), with 2-4 "aptitude" skills at higher levels (3-8).
 */
export function generateRandomSkills(rng: SeededRandom): CharacterSkills {
  const skills = createDefaultSkills();

  // Assign base levels (0-3) to all skills
  for (const id of ALL_SKILL_IDS) {
    skills[id].level = rng.nextInt(0, 4);
  }

  // Pick 2-4 aptitude skills and boost them
  const aptitudeCount = rng.nextInt(2, 5);
  const shuffled = [...ALL_SKILL_IDS];

  // Fisher-Yates shuffle (partial — only need first aptitudeCount)
  for (let i = 0; i < aptitudeCount; i++) {
    const j = rng.nextInt(i, shuffled.length);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  for (let i = 0; i < aptitudeCount; i++) {
    skills[shuffled[i]].level = rng.nextInt(3, 9);
  }

  return skills;
}

/**
 * Format skills as a summary string for display.
 * Shows non-zero skills sorted by level descending.
 */
export function formatSkillsSummary(skills: CharacterSkills): string {
  const entries = ALL_SKILL_IDS.filter((id) => skills[id].level > 0)
    .map((id) => {
      const def = SKILL_DEFINITIONS.find((d) => d.id === id);
      return { label: def?.label ?? id, level: skills[id].level };
    })
    .sort((a, b) => b.level - a.level);

  if (entries.length === 0) return "None";
  return entries.map((e) => `${e.label} ${e.level}`).join(", ");
}
