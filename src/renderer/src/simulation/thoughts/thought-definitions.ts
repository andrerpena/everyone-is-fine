// =============================================================================
// THOUGHT DEFINITIONS
// =============================================================================
// Defines thought types with mood effects and durations

// =============================================================================
// TYPES
// =============================================================================

/** All available thought identifiers */
export type ThoughtId =
  | "hungry"
  | "starving"
  | "well_rested"
  | "exhausted"
  | "tired"
  | "ate_recently"
  | "optimist_baseline"
  | "pessimist_baseline"
  | "neurotic_anxiety"
  | "feeling_brave"
  | "content";

/** Definition for a thought type */
export interface ThoughtDefinition {
  id: ThoughtId;
  label: string;
  description: string;
  /** Mood effect in range [-1, +1]. Negative = bad, positive = good */
  moodEffect: number;
  /** Duration in seconds. 0 = lasts while condition holds (condition-based) */
  durationSeconds: number;
}

// =============================================================================
// THOUGHT REGISTRY
// =============================================================================

/** Registry of all thought definitions */
export const THOUGHT_DEFINITIONS: readonly ThoughtDefinition[] = [
  // Need-based thoughts (condition-based, duration = 0)
  {
    id: "hungry",
    label: "Hungry",
    description: "Getting hungry, need to eat soon",
    moodEffect: -0.1,
    durationSeconds: 0,
  },
  {
    id: "starving",
    label: "Starving",
    description: "Desperately hungry, need food now",
    moodEffect: -0.3,
    durationSeconds: 0,
  },
  {
    id: "tired",
    label: "Tired",
    description: "Getting sleepy, could use some rest",
    moodEffect: -0.08,
    durationSeconds: 0,
  },
  {
    id: "exhausted",
    label: "Exhausted",
    description: "Completely drained, can barely stay awake",
    moodEffect: -0.15,
    durationSeconds: 0,
  },
  {
    id: "well_rested",
    label: "Well Rested",
    description: "Feeling refreshed and energized",
    moodEffect: 0.05,
    durationSeconds: 0,
  },
  {
    id: "ate_recently",
    label: "Ate Recently",
    description: "Satisfied after a meal",
    moodEffect: 0.05,
    durationSeconds: 0,
  },
  {
    id: "content",
    label: "Content",
    description: "Everything is going well",
    moodEffect: 0.05,
    durationSeconds: 0,
  },
  // Trait-based thoughts (condition-based, duration = 0)
  {
    id: "optimist_baseline",
    label: "Optimistic",
    description: "Naturally sees the bright side of things",
    moodEffect: 0.1,
    durationSeconds: 0,
  },
  {
    id: "pessimist_baseline",
    label: "Pessimistic",
    description: "Naturally expects the worst",
    moodEffect: -0.1,
    durationSeconds: 0,
  },
  {
    id: "neurotic_anxiety",
    label: "Anxious",
    description: "Constant underlying worry and tension",
    moodEffect: -0.08,
    durationSeconds: 0,
  },
  {
    id: "feeling_brave",
    label: "Feeling Brave",
    description: "Fearless and confident",
    moodEffect: 0.03,
    durationSeconds: 0,
  },
] as const;

/** Map of thought ID to definition for O(1) lookup */
export const THOUGHT_MAP: ReadonlyMap<ThoughtId, ThoughtDefinition> = new Map(
  THOUGHT_DEFINITIONS.map((d) => [d.id, d]),
);

/**
 * Get a thought definition by ID.
 */
export function getThoughtDefinition(
  id: ThoughtId,
): ThoughtDefinition | undefined {
  return THOUGHT_MAP.get(id);
}
