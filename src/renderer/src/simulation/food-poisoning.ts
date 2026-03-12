// =============================================================================
// FOOD POISONING
// =============================================================================
// Determines food poisoning chance based on meal quality.
// Lower quality meals have higher poisoning risk.

import { TICKS_PER_HOUR } from "../world/types";

/** Duration of food poisoning effect in ticks (6 in-game hours) */
export const FOOD_POISONING_DURATION_TICKS = TICKS_PER_HOUR * 6;

/** Maximum poisoning chance at quality 0 */
const MAX_POISONING_CHANCE = 0.4;

/**
 * Get the food poisoning chance for a given meal quality.
 * Quality 0 → 40% chance, quality 1 → 0% chance (linear).
 */
export function getFoodPoisoningChance(quality: number): number {
  const clamped = Math.max(0, Math.min(1, quality));
  return MAX_POISONING_CHANCE * (1 - clamped);
}

/**
 * Roll whether food poisoning occurs.
 * @param quality - Item quality (0-1)
 * @param random - Optional fixed random value for deterministic testing (0-1)
 */
export function rollFoodPoisoning(quality: number, random?: number): boolean {
  const chance = getFoodPoisoningChance(quality);
  const roll = random ?? Math.random();
  return roll < chance;
}
