// =============================================================================
// NEEDS CONFIGURATION
// =============================================================================
// Defines need types, decay rates, and threshold levels

// =============================================================================
// TYPES
// =============================================================================

/** Identifiers for character needs */
export type NeedId = "hunger" | "energy" | "mood" | "comfort";

/** Threshold levels from satisfied to critical */
export type NeedThreshold = "satisfied" | "minor" | "major" | "critical";

/** Configuration for a single need type */
export interface NeedConfig {
  id: NeedId;
  label: string;
  /** Rate of decay per second (subtracted from value each second) */
  decayPerSecond: number;
}

// =============================================================================
// NEED DEFINITIONS
// =============================================================================

/**
 * Need configurations with decay rates.
 * Mood is no longer decayed here — it's computed by the MoodThoughtSystem.
 *
 * Approximate time to empty from full (1.0 → 0.0):
 * - Hunger:  ~17 minutes (0.001/s)
 * - Energy:  ~21 minutes (0.0008/s)
 * - Comfort: ~33 minutes (0.0005/s)
 */
export const NEED_CONFIGS: readonly NeedConfig[] = [
  { id: "hunger", label: "Hunger", decayPerSecond: 0.001 },
  { id: "energy", label: "Energy", decayPerSecond: 0.0008 },
  { id: "comfort", label: "Comfort", decayPerSecond: 0.0005 },
] as const;

// =============================================================================
// THRESHOLD HELPERS
// =============================================================================

/** Threshold boundaries (value must be >= boundary to qualify) */
const THRESHOLD_BOUNDARIES: readonly {
  threshold: NeedThreshold;
  min: number;
}[] = [
  { threshold: "satisfied", min: 0.7 },
  { threshold: "minor", min: 0.4 },
  { threshold: "major", min: 0.2 },
  { threshold: "critical", min: 0 },
];

/**
 * Get the threshold level for a need value.
 * @param value - Need value in [0, 1] range
 * @returns The threshold level
 */
export function getNeedThreshold(value: number): NeedThreshold {
  for (const { threshold, min } of THRESHOLD_BOUNDARIES) {
    if (value >= min) return threshold;
  }
  return "critical";
}
