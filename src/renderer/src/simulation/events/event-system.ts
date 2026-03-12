// =============================================================================
// EVENT SYSTEM
// =============================================================================
// Periodically evaluates event definitions and triggers those whose conditions
// are met. Uses a Storyteller to control pacing and event category selection.

import { showToast } from "../../components/floating/toast/toastUtils";
import { useLogStore } from "../../lib/log-store";
import type { SeededRandom } from "../../world/factories/world-factory";
import type { World } from "../../world/types";
import type { EntityStore } from "../entity-store";
import type { Character } from "../types";
import {
  ALL_EVENTS,
  type EventContext,
  type EventDefinition,
} from "./event-definitions";
import { Storyteller } from "./storyteller";

export class EventSystem {
  private readonly entityStore: EntityStore;
  private readonly rng: SeededRandom;
  private readonly getWorld: () => World | null;
  private readonly addCharacter: (character: Character) => void;
  private readonly storyteller = new Storyteller();

  /** Tracks the last tick each event was evaluated */
  private lastEvaluated = new Map<string, number>();

  /** Tracks currently active duration-based events: event id → end tick */
  private activeEvents = new Map<string, number>();

  constructor(
    entityStore: EntityStore,
    rng: SeededRandom,
    getWorld: () => World | null,
    addCharacter: (character: Character) => void,
  ) {
    this.entityStore = entityStore;
    this.rng = rng;
    this.getWorld = getWorld;
    this.addCharacter = addCharacter;
  }

  update(tick: number): void {
    const world = this.getWorld();
    if (!world) return;

    // Clear expired active events
    for (const [id, endTick] of this.activeEvents) {
      if (tick >= endTick) {
        this.activeEvents.delete(id);
        const label = ALL_EVENTS.find((e) => e.id === id)?.label ?? id;
        const endMessage = `${label} has ended.`;
        useLogStore.getState().addEntry("info", endMessage, ["event", id]);
        showToast(endMessage, "default", { duration: 4000 });
      }
    }

    const ctx: EventContext = {
      entityStore: this.entityStore,
      world,
      rng: this.rng,
      tick,
      addCharacter: this.addCharacter,
    };

    // Ask the storyteller which events are eligible this tick
    const eligibleEvents = this.storyteller.selectEligibleEvents(
      ALL_EVENTS,
      ctx,
    );

    for (const event of eligibleEvents) {
      if (this.evaluateEvent(event, ctx)) {
        // One event per tick — storyteller pacing
        break;
      }
    }
  }

  /** Evaluate a single event. Returns true if the event fired. */
  private evaluateEvent(event: EventDefinition, ctx: EventContext): boolean {
    // Don't evaluate if this event is currently active
    if (this.activeEvents.has(event.id)) return false;

    const lastTick = this.lastEvaluated.get(event.id) ?? 0;
    if (ctx.tick - lastTick < event.cooldownTicks) return false;

    this.lastEvaluated.set(event.id, ctx.tick);

    if (!event.canTrigger(ctx)) return false;

    const message = event.execute(ctx);
    useLogStore.getState().addEntry("info", message, ["event", event.id]);
    showToast(message, "default", { duration: 5000 });

    // Track duration-based events
    if (event.durationTicks > 0) {
      this.activeEvents.set(event.id, ctx.tick + event.durationTicks);
    }

    // Notify storyteller that an event fired
    this.storyteller.recordEventFired(ctx.tick);

    return true;
  }

  /** Check if a specific event is currently active */
  isEventActive(eventId: string): boolean {
    return this.activeEvents.has(eventId);
  }

  /** Get all currently active event IDs */
  getActiveEventIds(): ReadonlySet<string> {
    return new Set(this.activeEvents.keys());
  }
}
