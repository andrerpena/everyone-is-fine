// =============================================================================
// WORK SCHEDULE SYSTEM
// =============================================================================
// Per-colonist 24-hour schedule defining activity types for each hour.
// Activities: work, sleep, recreation, anything.

// =============================================================================
// TYPES
// =============================================================================

/** Activity types assignable to schedule hours */
export type ScheduleActivity = "work" | "sleep" | "recreation" | "anything";

/**
 * A 24-element array where index = hour (0-23).
 * Each element defines what activity the colonist should focus on during that hour.
 */
export type Schedule = [
  ScheduleActivity,
  ScheduleActivity,
  ScheduleActivity,
  ScheduleActivity,
  ScheduleActivity,
  ScheduleActivity,
  ScheduleActivity,
  ScheduleActivity,
  ScheduleActivity,
  ScheduleActivity,
  ScheduleActivity,
  ScheduleActivity,
  ScheduleActivity,
  ScheduleActivity,
  ScheduleActivity,
  ScheduleActivity,
  ScheduleActivity,
  ScheduleActivity,
  ScheduleActivity,
  ScheduleActivity,
  ScheduleActivity,
  ScheduleActivity,
  ScheduleActivity,
  ScheduleActivity,
];

/** All valid schedule activities */
export const ALL_SCHEDULE_ACTIVITIES: readonly ScheduleActivity[] = [
  "work",
  "sleep",
  "recreation",
  "anything",
] as const;

// =============================================================================
// DEFAULT SCHEDULE
// =============================================================================

/**
 * Default colonist schedule:
 * - Sleep:      21:00 - 05:00 (8 hours)
 * - Work:       06:00 - 17:00 (12 hours)
 * - Recreation:  18:00 - 20:00 (3 hours)
 * - Anything:   05:00 - 05:00 (1 hour transition)
 */
export function createDefaultSchedule(): Schedule {
  return [
    // 00-05: sleep
    "sleep",
    "sleep",
    "sleep",
    "sleep",
    "sleep",
    // 05: anything (transition)
    "anything",
    // 06-17: work
    "work",
    "work",
    "work",
    "work",
    "work",
    "work",
    "work",
    "work",
    "work",
    "work",
    "work",
    "work",
    // 18-20: recreation
    "recreation",
    "recreation",
    "recreation",
    // 21-23: sleep
    "sleep",
    "sleep",
    "sleep",
  ];
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get the scheduled activity for a given hour.
 * Clamps hour to 0-23 range.
 */
export function getScheduledActivity(
  schedule: Schedule,
  hour: number,
): ScheduleActivity {
  const clampedHour = Math.max(0, Math.min(23, Math.floor(hour)));
  return schedule[clampedHour];
}

/**
 * Check if a schedule activity string is valid.
 */
export function isValidScheduleActivity(
  activity: string,
): activity is ScheduleActivity {
  return ALL_SCHEDULE_ACTIVITIES.includes(activity as ScheduleActivity);
}
