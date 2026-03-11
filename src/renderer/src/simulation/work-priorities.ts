// =============================================================================
// WORK PRIORITIES
// =============================================================================
// Per-colonist, per-work-type priority system (0-4).
// 0 = disabled, 1 = highest priority, 4 = lowest priority.

import type { Position3D } from "../world/types";
import type { Character, EntityId } from "./types";

// =============================================================================
// TYPES
// =============================================================================

/** Work type categories that map to auto-assignment systems */
export type WorkType =
  | "hauling"
  | "construction"
  | "growing"
  | "cooking"
  | "mining";

/** Priority level: 0 = disabled, 1 = highest, 4 = lowest */
export type WorkPriorityLevel = 0 | 1 | 2 | 3 | 4;

/** Per-work-type priority mapping */
export type WorkPriorities = Record<WorkType, WorkPriorityLevel>;

/** All available work types */
export const ALL_WORK_TYPES: readonly WorkType[] = [
  "hauling",
  "construction",
  "growing",
  "cooking",
  "mining",
] as const;

// =============================================================================
// DEFAULTS
// =============================================================================

/** Default work priorities — all enabled at medium priority */
export function createDefaultWorkPriorities(): WorkPriorities {
  return {
    hauling: 3,
    construction: 3,
    growing: 3,
    cooking: 3,
    mining: 3,
  };
}

// =============================================================================
// CHARACTER SELECTION
// =============================================================================

export interface EligibleCharacter {
  id: EntityId;
  priority: WorkPriorityLevel;
  distance: number;
}

/**
 * Get eligible characters for a work type, sorted by priority (ascending = higher priority first),
 * then by distance (ascending = closer first).
 *
 * Filters out:
 * - Characters with priority 0 (disabled) for this work type
 * - Characters with mental breaks
 * - Drafted characters
 * - Characters already moving
 * - Characters with active jobs
 */
export function getEligibleCharacters(
  characters: Iterable<Character>,
  workType: WorkType,
  target: Position3D,
  hasActiveJob: (id: EntityId) => boolean,
): EligibleCharacter[] {
  const eligible: EligibleCharacter[] = [];

  for (const character of characters) {
    // Skip characters in mental breaks
    if (character.mentalBreak !== null) continue;
    // Skip drafted characters
    if (character.control.mode === "drafted") continue;
    // Skip non-idle characters
    if (character.control.mode !== "idle") continue;
    // Skip characters already moving
    if (character.movement.isMoving) continue;
    // Skip characters with active jobs
    if (hasActiveJob(character.id)) continue;

    const priority = character.workPriorities[workType];
    // Skip disabled work types
    if (priority === 0) continue;

    const distance =
      Math.abs(character.position.x - target.x) +
      Math.abs(character.position.y - target.y);

    eligible.push({ id: character.id, priority, distance });
  }

  // Sort by priority (ascending — 1 is highest), then by distance
  eligible.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.distance - b.distance;
  });

  return eligible;
}

/**
 * Pick the best character for a work type at a given target position.
 * Returns the character ID with the highest priority (lowest number),
 * breaking ties by distance.
 */
export function pickBestCharacter(
  characters: Iterable<Character>,
  workType: WorkType,
  target: Position3D,
  hasActiveJob: (id: EntityId) => boolean,
): EntityId | null {
  const eligible = getEligibleCharacters(
    characters,
    workType,
    target,
    hasActiveJob,
  );
  return eligible.length > 0 ? eligible[0].id : null;
}
