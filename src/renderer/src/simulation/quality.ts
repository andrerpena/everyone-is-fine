// =============================================================================
// QUALITY SYSTEM
// =============================================================================
// Calculates quality for crafted structures and items based on skill level.

/** Quality label thresholds */
const QUALITY_LABELS = [
  { max: 0.2, label: "Awful" },
  { max: 0.4, label: "Poor" },
  { max: 0.6, label: "Normal" },
  { max: 0.8, label: "Good" },
  { max: 0.95, label: "Excellent" },
  { max: Infinity, label: "Masterwork" },
] as const;

/**
 * Calculate quality from a skill level (0-20).
 * Base quality scales linearly with skill, with random variance.
 * - Skill 0 → base 0.2 (awful-poor range)
 * - Skill 10 → base 0.5 (normal range)
 * - Skill 20 → base 0.8 (good-excellent range)
 * Random variance of ±0.15 allows lucky/unlucky outcomes.
 */
export function calculateQualityFromSkill(skillLevel: number): number {
  const base = 0.2 + (skillLevel / 20) * 0.6;
  const variance = (Math.random() - 0.5) * 0.3; // ±0.15
  return Math.max(0, Math.min(1, base + variance));
}

/**
 * Get a human-readable quality label.
 */
export function getQualityLabel(quality: number): string {
  for (const { max, label } of QUALITY_LABELS) {
    if (quality < max) return label;
  }
  return "Masterwork";
}
