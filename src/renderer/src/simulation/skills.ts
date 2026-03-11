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

/** Passion level for a skill — affects XP gain rate */
export type Passion = "none" | "minor" | "major";

/** XP multipliers per passion level */
export const PASSION_XP_MULTIPLIERS: Record<Passion, number> = {
  none: 1,
  minor: 1.5,
  major: 2,
} as const;

/** Data for a single skill */
export interface SkillData {
  /** Current skill level (0-20) */
  level: number;
  /** Experience points toward next level */
  experience: number;
  /** Passion level affecting XP gain rate */
  passion: Passion;
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
    skills[id] = { level: 0, experience: 0, passion: "none" };
  }
  return skills;
}

/**
 * Generate random starting skills for a new colonist.
 * Most skills are low (0-3), with 2-4 "aptitude" skills at higher levels (3-8).
 * Passions: 1-2 major passions, 3-5 minor passions, rest none.
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

  // Assign passions using the already-shuffled array
  // First 1-2 get major passion, next 3-5 get minor passion
  const majorCount = rng.nextInt(1, 3);
  const minorCount = rng.nextInt(3, 6);

  for (let i = 0; i < shuffled.length; i++) {
    if (i < majorCount) {
      skills[shuffled[i]].passion = "major";
    } else if (i < majorCount + minorCount) {
      skills[shuffled[i]].passion = "minor";
    }
  }

  return skills;
}

// =============================================================================
// EXPERIENCE & LEVELING
// =============================================================================

/**
 * XP required to advance from `level` to `level + 1`.
 * Uses a linear scaling formula: (level + 1) * 100.
 * Level 0→1: 100 XP, Level 5→6: 600 XP, Level 19→20: 2000 XP.
 */
export function xpForNextLevel(level: number): number {
  return (level + 1) * 100;
}

/** Result of granting experience to a skill */
export interface ExperienceResult {
  /** Updated skills record (new reference) */
  skills: CharacterSkills;
  /** Whether at least one level-up occurred */
  leveledUp: boolean;
  /** Number of levels gained */
  levelsGained: number;
}

/**
 * Grant experience points to a skill, handling level-ups.
 * Returns a new skills record (does not mutate the input).
 *
 * @param skills - Current character skills
 * @param skillId - Which skill to grant XP to
 * @param amount - XP to add (must be positive)
 * @returns Updated skills and level-up info
 */
export function grantExperience(
  skills: CharacterSkills,
  skillId: SkillId,
  amount: number,
): ExperienceResult {
  const current = skills[skillId];

  // Already at max level — no XP gain
  if (current.level >= MAX_SKILL_LEVEL) {
    return { skills, leveledUp: false, levelsGained: 0 };
  }

  // Apply passion multiplier to XP gained
  const effectiveAmount = Math.floor(
    amount * PASSION_XP_MULTIPLIERS[current.passion],
  );

  let level = current.level;
  let xp = current.experience + effectiveAmount;
  let levelsGained = 0;

  // Process level-ups (handle multiple in one grant)
  while (level < MAX_SKILL_LEVEL) {
    const needed = xpForNextLevel(level);
    if (xp < needed) break;
    xp -= needed;
    level++;
    levelsGained++;
  }

  // Cap XP at 0 if max level reached
  if (level >= MAX_SKILL_LEVEL) {
    xp = 0;
  }

  const updatedSkills: CharacterSkills = {
    ...skills,
    [skillId]: { level, experience: xp, passion: current.passion },
  };

  return {
    skills: updatedSkills,
    leveledUp: levelsGained > 0,
    levelsGained,
  };
}

/**
 * Get progress toward the next level as a 0-1 fraction.
 * Returns 1 if at max level.
 */
export function getSkillProgress(skill: SkillData): number {
  if (skill.level >= MAX_SKILL_LEVEL) return 1;
  const needed = xpForNextLevel(skill.level);
  return needed > 0 ? skill.experience / needed : 0;
}

// =============================================================================
// WORK SPEED
// =============================================================================

/**
 * Maps job types to the skill that affects their speed and grants XP.
 * Jobs not listed here use base speed (1.0) and grant no XP.
 */
export const JOB_SKILL_MAP: Partial<Record<string, SkillId>> = {
  chop: "plants",
  mine: "mining",
  forage: "plants",
  sow: "plants",
  harvest: "plants",
  build: "construction",
  deconstruct: "construction",
};

/** Base XP granted per completed work step */
export const BASE_WORK_XP = 20;

/**
 * Get the work speed multiplier for a given skill level.
 * Linear scaling: 1.0 at level 0, 2.0 at level 20.
 * Formula: 1 + level * 0.05
 */
export function getWorkSpeedMultiplier(level: number): number {
  return 1 + Math.min(level, MAX_SKILL_LEVEL) * 0.05;
}

// =============================================================================
// DISPLAY HELPERS
// =============================================================================

/**
 * Format skills as a summary string for display.
 * Shows non-zero skills sorted by level descending.
 */
export function formatSkillsSummary(skills: CharacterSkills): string {
  const entries = ALL_SKILL_IDS.filter((id) => skills[id].level > 0)
    .map((id) => {
      const def = SKILL_DEFINITIONS.find((d) => d.id === id);
      const skill = skills[id];
      const passionIndicator =
        skill.passion === "major"
          ? "\u2605\u2605"
          : skill.passion === "minor"
            ? "\u2605"
            : "";
      return {
        label: def?.label ?? id,
        level: skill.level,
        passionIndicator,
      };
    })
    .sort((a, b) => b.level - a.level);

  if (entries.length === 0) return "None";
  return entries
    .map(
      (e) =>
        `${e.label} ${e.level}${e.passionIndicator ? ` ${e.passionIndicator}` : ""}`,
    )
    .join(", ");
}
