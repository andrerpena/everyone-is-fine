// =============================================================================
// RECIPE REGISTRY
// =============================================================================
// Defines crafting recipes for workstations. Each recipe specifies ingredients,
// output, work time, and skill requirements.

import type { SkillId } from "../../simulation/skills";
import type { ItemType, StructureType } from "../types";

// =============================================================================
// TYPES
// =============================================================================

export interface RecipeIngredient {
  /** Item type required */
  readonly itemType: ItemType;
  /** Number of items needed */
  readonly count: number;
}

export interface CraftingRecipe {
  /** Unique recipe identifier */
  readonly id: string;
  /** Display name */
  readonly label: string;
  /** Which workstation type this recipe uses */
  readonly workstation: StructureType;
  /** Required ingredients */
  readonly ingredients: readonly RecipeIngredient[];
  /** Output item type and count */
  readonly output: { readonly itemType: ItemType; readonly count: number };
  /** Base work ticks to complete */
  readonly workTicks: number;
  /** Skill that affects speed and quality */
  readonly skillId: SkillId;
  /** Minimum skill level required to attempt this recipe */
  readonly minSkillLevel: number;
}

// =============================================================================
// RECIPE DEFINITIONS
// =============================================================================

/** All crafting recipes, ordered by preference (higher-tier first for selection) */
export const RECIPE_REGISTRY: readonly CraftingRecipe[] = [
  // Cooking — campfire recipes (ordered highest-tier first)
  {
    id: "cook_lavish",
    label: "Cook Lavish Meal",
    workstation: "campfire",
    ingredients: [
      { itemType: "meat", count: 1 },
      { itemType: "vegetable", count: 2 },
    ],
    output: { itemType: "meal_lavish", count: 1 },
    workTicks: 450,
    skillId: "cooking",
    minSkillLevel: 8,
  },
  {
    id: "cook_fine",
    label: "Cook Fine Meal",
    workstation: "campfire",
    ingredients: [
      { itemType: "meat", count: 1 },
      { itemType: "vegetable", count: 1 },
    ],
    output: { itemType: "meal_fine", count: 1 },
    workTicks: 300,
    skillId: "cooking",
    minSkillLevel: 4,
  },
  {
    id: "cook_simple",
    label: "Cook Simple Meal",
    workstation: "campfire",
    ingredients: [], // Uses any single raw food item (handled by cooking system)
    output: { itemType: "meal_simple", count: 1 },
    workTicks: 180,
    skillId: "cooking",
    minSkillLevel: 0,
  },
] as const;

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get all recipes available at a given workstation type.
 * Returns recipes in priority order (highest-tier first).
 */
export function getRecipesForWorkstation(
  workstation: StructureType,
): CraftingRecipe[] {
  return RECIPE_REGISTRY.filter((r) => r.workstation === workstation);
}

/**
 * Check if a recipe's skill requirement is met.
 */
export function meetsSkillRequirement(
  recipe: CraftingRecipe,
  skillLevel: number,
): boolean {
  return skillLevel >= recipe.minSkillLevel;
}
