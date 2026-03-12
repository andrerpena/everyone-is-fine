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
  | "content"
  | "mental_break_sad_wander"
  | "mental_break_food_binge"
  | "mental_break_daze"
  | "environment_beautiful"
  | "environment_pleasant"
  | "environment_ugly"
  | "environment_hideous"
  | "environment_impressive"
  | "food_poisoning"
  | "ate_nutrient_paste"
  | "chatted_with_friend"
  | "chatted_with_rival"
  | "has_friends"
  | "no_friends"
  | "has_rival"
  | "in_relationship"
  | "broke_up"
  | "was_insulted"
  | "social_fight"
  | "got_married"
  | "attended_wedding"
  | "eclipse"
  | "psychic_drone"
  | "toxic_fallout"
  | "volcanic_winter";

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
  // Mental break thoughts (condition-based, duration = 0)
  {
    id: "mental_break_sad_wander",
    label: "Mental Break: Sad Wander",
    description: "Overwhelmed by sadness, wandering aimlessly",
    moodEffect: -0.05,
    durationSeconds: 0,
  },
  {
    id: "mental_break_food_binge",
    label: "Mental Break: Food Binge",
    description: "Compulsively seeking and eating food",
    moodEffect: -0.03,
    durationSeconds: 0,
  },
  {
    id: "mental_break_daze",
    label: "Mental Break: Daze",
    description: "Staring blankly, unresponsive to the world",
    moodEffect: -0.08,
    durationSeconds: 0,
  },
  // Environment/beauty thoughts (condition-based, duration = 0)
  {
    id: "environment_beautiful",
    label: "Beautiful Room",
    description: "Surrounded by beauty, this room is wonderful",
    moodEffect: 0.1,
    durationSeconds: 0,
  },
  {
    id: "environment_pleasant",
    label: "Pleasant Surroundings",
    description: "This room looks nice",
    moodEffect: 0.05,
    durationSeconds: 0,
  },
  {
    id: "environment_ugly",
    label: "Ugly Environment",
    description: "This place is not easy on the eyes",
    moodEffect: -0.05,
    durationSeconds: 0,
  },
  {
    id: "environment_hideous",
    label: "Hideous Environment",
    description: "This place is appallingly ugly",
    moodEffect: -0.1,
    durationSeconds: 0,
  },
  {
    id: "environment_impressive",
    label: "Impressive Room",
    description: "This room is truly impressive",
    moodEffect: 0.05,
    durationSeconds: 0,
  },
  // Event-based timed thoughts
  {
    id: "food_poisoning",
    label: "Food Poisoning",
    description: "Feeling sick after eating a poorly prepared meal",
    moodEffect: -0.15,
    durationSeconds: 21600, // 6 hours
  },
  {
    id: "ate_nutrient_paste",
    label: "Ate Nutrient Paste",
    description: "That paste was awful, but at least it was filling",
    moodEffect: -0.08,
    durationSeconds: 14400, // 4 hours
  },
  // Social thoughts (condition-based)
  {
    id: "has_friends",
    label: "Has Friends",
    description: "It's nice to have friends around",
    moodEffect: 0.05,
    durationSeconds: 0,
  },
  {
    id: "no_friends",
    label: "No Friends",
    description: "Nobody here really knows me",
    moodEffect: -0.05,
    durationSeconds: 0,
  },
  {
    id: "has_rival",
    label: "Has a Rival",
    description: "Someone here really gets on my nerves",
    moodEffect: -0.03,
    durationSeconds: 0,
  },
  // Social thoughts (timed)
  {
    id: "chatted_with_friend",
    label: "Chatted with Friend",
    description: "Had a nice chat with a friend",
    moodEffect: 0.05,
    durationSeconds: 14400, // 4 hours
  },
  {
    id: "chatted_with_rival",
    label: "Chatted with Rival",
    description: "Had an unpleasant interaction with someone I dislike",
    moodEffect: -0.05,
    durationSeconds: 14400, // 4 hours
  },
  {
    id: "in_relationship",
    label: "In a Relationship",
    description: "Life is better with someone special",
    moodEffect: 0.08,
    durationSeconds: 0,
  },
  {
    id: "broke_up",
    label: "Broke Up",
    description: "The relationship ended. Everything feels empty.",
    moodEffect: -0.15,
    durationSeconds: 172800, // 48 hours
  },
  {
    id: "was_insulted",
    label: "Was Insulted",
    description: "Someone said something hurtful",
    moodEffect: -0.05,
    durationSeconds: 28800, // 8 hours
  },
  {
    id: "social_fight",
    label: "Social Fight",
    description: "Got into a physical fight with someone",
    moodEffect: -0.1,
    durationSeconds: 43200, // 12 hours
  },
  {
    id: "got_married",
    label: "Got Married",
    description: "We tied the knot! Everything feels wonderful.",
    moodEffect: 0.2,
    durationSeconds: 259200, // 72 hours
  },
  {
    id: "attended_wedding",
    label: "Attended a Wedding",
    description: "Witnessed a beautiful ceremony between two colonists.",
    moodEffect: 0.08,
    durationSeconds: 86400, // 24 hours
  },
  // Event thoughts (timed)
  {
    id: "eclipse",
    label: "Eclipse",
    description: "An eerie darkness covers the land.",
    moodEffect: -0.05,
    durationSeconds: 3600, // matches eclipse event duration in ticks / TPS
  },
  {
    id: "psychic_drone",
    label: "Psychic Drone",
    description: "A strange psychic hum clouds the mind.",
    moodEffect: -0.12,
    durationSeconds: 5400, // matches psychic drone event duration in ticks / TPS
  },
  {
    id: "toxic_fallout",
    label: "Toxic Fallout",
    description: "Poisonous particles fill the air, making everyone uneasy.",
    moodEffect: -0.08,
    durationSeconds: 10800, // matches toxic fallout event duration in ticks / TPS
  },
  {
    id: "volcanic_winter",
    label: "Volcanic Winter",
    description:
      "Ash clouds block the sun, plunging the world into bitter cold.",
    moodEffect: -0.06,
    durationSeconds: 14400, // matches volcanic winter event duration in ticks / TPS
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
