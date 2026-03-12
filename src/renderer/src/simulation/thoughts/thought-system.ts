// =============================================================================
// MOOD THOUGHT SYSTEM
// =============================================================================
// Evaluates character conditions to add/remove thoughts, then computes mood

import type { EntityStore } from "../entity-store";
import { getNeedThreshold } from "../needs/needs-config";
import type { Room } from "../rooms/room-types";
import type { Character } from "../types";
import { THOUGHT_MAP, type ThoughtId } from "./thought-definitions";

// =============================================================================
// ENVIRONMENT CONTEXT
// =============================================================================

/** Environmental context for a character's current location */
export interface EnvironmentContext {
  /** Average beauty of the room (null = outdoors or no room) */
  roomBeauty: number | null;
  /** Composite impressiveness score (null = outdoors or no room) */
  roomImpressiveness: number | null;
}

/** Function to look up a room at a position */
export type RoomLookup = (x: number, y: number, z: number) => Room | null;

// =============================================================================
// TYPES
// =============================================================================

/** An active thought on a character */
export interface ActiveThought {
  /** Which thought this is */
  thoughtId: ThoughtId;
  /** Tick when this thought was added */
  addedAtTick: number;
  /** Tick when this thought expires (null = condition-based, removed when condition no longer holds) */
  expiresAtTick: number | null;
}

// =============================================================================
// MOOD COMPUTATION
// =============================================================================

/** Base mood when no thoughts are active */
const BASE_MOOD = 0.5;

/**
 * Compute mood from a list of active thoughts.
 * Returns base mood (0.5) + sum of all thought mood effects, clamped to [0, 1].
 */
export function computeMoodFromThoughts(thoughts: ActiveThought[]): number {
  let total = BASE_MOOD;
  for (const thought of thoughts) {
    const def = THOUGHT_MAP.get(thought.thoughtId);
    if (def) {
      total += def.moodEffect;
    }
  }
  return Math.max(0, Math.min(1, total));
}

// =============================================================================
// CONDITION EVALUATION
// =============================================================================

/** Social context for evaluating relationship-based thoughts */
export interface SocialContext {
  /** Total number of colonists in the colony */
  totalColonists: number;
}

/**
 * Evaluate what condition-based thoughts a character should have right now.
 * Returns a set of ThoughtIds that should be active.
 */
export function evaluateConditionThoughts(
  character: Character,
  envContext?: EnvironmentContext,
  socialContext?: SocialContext,
): Set<ThoughtId> {
  const thoughts = new Set<ThoughtId>();
  const { needs, traits } = character;

  // --- Hunger thoughts ---
  const hungerThreshold = getNeedThreshold(needs.hunger);
  if (hungerThreshold === "critical") {
    thoughts.add("starving");
  } else if (hungerThreshold === "major") {
    thoughts.add("hungry");
  } else if (hungerThreshold === "satisfied") {
    thoughts.add("ate_recently");
  }

  // --- Energy thoughts ---
  const energyThreshold = getNeedThreshold(needs.energy);
  if (energyThreshold === "critical") {
    thoughts.add("exhausted");
  } else if (energyThreshold === "major") {
    thoughts.add("tired");
  } else if (energyThreshold === "satisfied") {
    thoughts.add("well_rested");
  }

  // --- General contentment (all needs satisfied) ---
  if (hungerThreshold === "satisfied" && energyThreshold === "satisfied") {
    thoughts.add("content");
  }

  // --- Mental break thoughts ---
  if (character.mentalBreak?.type === "sad_wander") {
    thoughts.add("mental_break_sad_wander");
  }
  if (character.mentalBreak?.type === "food_binge") {
    thoughts.add("mental_break_food_binge");
  }
  if (character.mentalBreak?.type === "daze") {
    thoughts.add("mental_break_daze");
  }

  // --- Trait-based thoughts ---
  if (traits.includes("optimist")) {
    thoughts.add("optimist_baseline");
  }
  if (traits.includes("pessimist")) {
    thoughts.add("pessimist_baseline");
  }
  if (traits.includes("neurotic")) {
    thoughts.add("neurotic_anxiety");
  }
  if (traits.includes("brave")) {
    thoughts.add("feeling_brave");
  }

  // --- Social/relationship thoughts ---
  const opinions = Object.values(character.relationships);
  if (opinions.some((op) => op >= 30)) {
    thoughts.add("has_friends");
  }
  if (
    socialContext &&
    socialContext.totalColonists >= 3 &&
    !opinions.some((op) => op >= 10)
  ) {
    thoughts.add("no_friends");
  }
  if (opinions.some((op) => op <= -60)) {
    thoughts.add("has_rival");
  }
  if (character.partner !== null) {
    thoughts.add("in_relationship");
  }

  // --- Environment/beauty thoughts ---
  if (envContext) {
    const { roomBeauty, roomImpressiveness } = envContext;
    if (roomBeauty !== null) {
      if (roomBeauty >= 2.0) {
        thoughts.add("environment_beautiful");
      } else if (roomBeauty >= 1.0) {
        thoughts.add("environment_pleasant");
      } else if (roomBeauty <= -1.5) {
        thoughts.add("environment_hideous");
      } else if (roomBeauty <= -0.5) {
        thoughts.add("environment_ugly");
      }
    }
    if (roomImpressiveness !== null && roomImpressiveness >= 60) {
      thoughts.add("environment_impressive");
    }
  }

  return thoughts;
}

// =============================================================================
// THOUGHT SYSTEM CLASS
// =============================================================================

/**
 * Manages thoughts for all characters and computes mood each tick.
 *
 * Condition-based thoughts (durationSeconds = 0) are added/removed based on
 * current character state. Timed thoughts expire after their duration.
 */
export class MoodThoughtSystem {
  private entityStore: EntityStore;
  private getRoomAt: RoomLookup | null;

  constructor(entityStore: EntityStore, getRoomAt?: RoomLookup) {
    this.entityStore = entityStore;
    this.getRoomAt = getRoomAt ?? null;
  }

  /**
   * Update thoughts and mood for all characters.
   * @param currentTick - Current simulation tick number
   */
  update(currentTick: number): void {
    for (const character of this.entityStore.values()) {
      const updatedThoughts = this.updateCharacterThoughts(
        character,
        currentTick,
      );
      const mood = computeMoodFromThoughts(updatedThoughts);

      // Only update if thoughts or mood actually changed
      const thoughtsChanged =
        updatedThoughts.length !== character.thoughts.length ||
        updatedThoughts.some(
          (t, i) => t.thoughtId !== character.thoughts[i]?.thoughtId,
        );
      const moodChanged = Math.abs(mood - character.needs.mood) > 0.0001;

      if (thoughtsChanged || moodChanged) {
        this.entityStore.update(character.id, {
          thoughts: updatedThoughts,
          needs: { ...character.needs, mood },
        });
      }
    }
  }

  private getEnvironmentContext(
    character: Character,
  ): EnvironmentContext | undefined {
    if (!this.getRoomAt) return undefined;
    const { x, y, z } = character.position;
    const room = this.getRoomAt(x, y, z);
    if (!room || room.isOutdoors || !room.stats) return undefined;
    return {
      roomBeauty: room.stats.beauty,
      roomImpressiveness: room.stats.impressiveness,
    };
  }

  private updateCharacterThoughts(
    character: Character,
    currentTick: number,
  ): ActiveThought[] {
    // 1. Remove expired timed thoughts
    const surviving = character.thoughts.filter(
      (t) => t.expiresAtTick === null || t.expiresAtTick > currentTick,
    );

    // 2. Evaluate which condition-based thoughts should be active
    const envContext = this.getEnvironmentContext(character);
    const socialContext: SocialContext = {
      totalColonists: this.entityStore.size,
    };
    const conditionThoughts = evaluateConditionThoughts(
      character,
      envContext,
      socialContext,
    );

    // 3. Identify condition-based thought IDs currently active
    const conditionBased = new Set<ThoughtId>();
    for (const def of THOUGHT_MAP.values()) {
      if (def.durationSeconds === 0) {
        conditionBased.add(def.id);
      }
    }

    // 4. Remove condition-based thoughts whose condition no longer holds
    const result = surviving.filter((t) => {
      if (conditionBased.has(t.thoughtId)) {
        return conditionThoughts.has(t.thoughtId);
      }
      return true; // Keep timed thoughts (they're filtered by expiry above)
    });

    // 5. Add new condition-based thoughts that aren't already present
    const existingIds = new Set(result.map((t) => t.thoughtId));
    for (const thoughtId of conditionThoughts) {
      if (!existingIds.has(thoughtId)) {
        result.push({
          thoughtId,
          addedAtTick: currentTick,
          expiresAtTick: null,
        });
      }
    }

    return result;
  }
}
