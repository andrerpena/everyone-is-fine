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
   * Check if enough time has passed since the last event.
   */
  canFireEvent(currentTick: number): boolean {
    return currentTick - this.lastEventTick >= GLOBAL_EVENT_COOLDOWN;
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
   * and mood-based category filter.
   */
  selectEligibleEvents(
    allEvents: readonly EventDefinition[],
    ctx: EventContext,
  ): EventDefinition[] {
    if (!this.canFireEvent(ctx.tick)) return [];

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
