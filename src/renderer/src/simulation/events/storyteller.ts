// =============================================================================
// STORYTELLER
// =============================================================================
// Controls event pacing and selection based on colony mood. Prevents event
// spam with a global cooldown and biases event category selection based on
// the colony's average mood to create dramatic narrative arcs.

import type { EntityStore } from "../entity-store";
import type {
  EventCategory,
  EventContext,
  EventDefinition,
} from "./event-definitions";

// =============================================================================
// CONSTANTS
// =============================================================================

/** Minimum ticks between any two events firing (~30 seconds at 60 TPS) */
export const GLOBAL_EVENT_COOLDOWN = 1800;

/** Colony mood above this threshold allows negative events */
export const HIGH_MOOD_THRESHOLD = 0.7;

/** Colony mood below this threshold biases toward positive events */
export const LOW_MOOD_THRESHOLD = 0.4;

/** Colonist count at which difficulty factor reaches 1.0 */
export const DIFFICULTY_COLONIST_BASELINE = 5;

/** Day at which difficulty factor reaches 1.0 */
export const DIFFICULTY_DAY_BASELINE = 20;

/** Minimum difficulty multiplier (events happen slower) */
export const MIN_DIFFICULTY = 0.5;

/** Maximum difficulty multiplier (events happen faster) */
export const MAX_DIFFICULTY = 2.0;

// =============================================================================
// STORYTELLER CLASS
// =============================================================================

export class Storyteller {
  /** Tick when the last event of any kind was fired (-Infinity = never) */
  private lastEventTick = -Infinity;

  /**
   * Compute the average mood across all colonists.
   * Returns 0.5 if no colonists exist.
   */
  getAverageMood(entityStore: EntityStore): number {
    let total = 0;
    let count = 0;
    for (const [, character] of entityStore) {
      total += character.needs.mood;
      count++;
    }
    return count > 0 ? total / count : 0.5;
  }

  /**
   * Get the allowed event categories based on current colony mood.
   * - High mood (> 0.7): all categories allowed (good time for challenges)
   * - Low mood (< 0.4): only positive and neutral (colony needs a break)
   * - Medium mood: all categories allowed
   */
  getAllowedCategories(avgMood: number): Set<EventCategory> {
    if (avgMood < LOW_MOOD_THRESHOLD) {
      return new Set(["positive", "neutral"]);
    }
    return new Set(["positive", "negative", "neutral"]);
  }

  /**
   * Compute a difficulty multiplier based on colony size and age.
   * Higher values mean events fire more frequently.
   *
   * - Colony size factor: colonistCount / BASELINE (clamped 0.5–1.5)
   * - Time factor: day / BASELINE (clamped 0.5–1.5)
   * - Combined: average of both, clamped to [MIN_DIFFICULTY, MAX_DIFFICULTY]
   */
  getDifficultyMultiplier(colonistCount: number, day: number): number {
    const sizeFactor = Math.max(
      0.5,
      Math.min(1.5, colonistCount / DIFFICULTY_COLONIST_BASELINE),
    );
    const timeFactor = Math.max(
      0.5,
      Math.min(1.5, day / DIFFICULTY_DAY_BASELINE),
    );
    const combined = (sizeFactor + timeFactor) / 2;
    return Math.max(MIN_DIFFICULTY, Math.min(MAX_DIFFICULTY, combined));
  }

  /**
   * Check if enough time has passed since the last event.
   * The cooldown is scaled by the difficulty multiplier — higher difficulty
   * means shorter cooldowns (more frequent events).
   */
  canFireEvent(currentTick: number, difficultyMultiplier = 1): boolean {
    const scaledCooldown = GLOBAL_EVENT_COOLDOWN / difficultyMultiplier;
    return currentTick - this.lastEventTick >= scaledCooldown;
  }

  /**
   * Filter events to those whose category is currently allowed.
   */
  filterByCategory(
    events: readonly EventDefinition[],
    allowedCategories: Set<EventCategory>,
  ): EventDefinition[] {
    return events.filter((e) => allowedCategories.has(e.category));
  }

  /**
   * Select which events are eligible to be evaluated this tick.
   * Returns a filtered list of events that pass the storyteller's pacing
   * and mood-based category filter. Uses difficulty scaling based on
   * colony size and age.
   */
  selectEligibleEvents(
    allEvents: readonly EventDefinition[],
    ctx: EventContext,
  ): EventDefinition[] {
    const difficulty = this.getDifficultyMultiplier(
      ctx.entityStore.size,
      ctx.world.time.day,
    );
    if (!this.canFireEvent(ctx.tick, difficulty)) return [];

    const avgMood = this.getAverageMood(ctx.entityStore);
    const allowed = this.getAllowedCategories(avgMood);
    return this.filterByCategory(allEvents, allowed);
  }

  /**
   * Record that an event was fired at the given tick.
   */
  recordEventFired(tick: number): void {
    this.lastEventTick = tick;
  }
}
