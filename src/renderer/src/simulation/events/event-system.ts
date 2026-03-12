// =============================================================================
// EVENT SYSTEM
// =============================================================================
// Periodically evaluates event definitions and triggers those whose conditions
// are met. Tracks per-event cooldowns to prevent rapid re-firing.

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

export class EventSystem {
  private readonly entityStore: EntityStore;
  private readonly rng: SeededRandom;
  private readonly getWorld: () => World | null;
  private readonly addCharacter: (character: Character) => void;

  /** Tracks the last tick each event was evaluated */
  private lastEvaluated = new Map<string, number>();

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

    const ctx: EventContext = {
      entityStore: this.entityStore,
      world,
      rng: this.rng,
      tick,
      addCharacter: this.addCharacter,
    };

    for (const event of ALL_EVENTS) {
      this.evaluateEvent(event, ctx);
    }
  }

  private evaluateEvent(event: EventDefinition, ctx: EventContext): void {
    const lastTick = this.lastEvaluated.get(event.id) ?? 0;
    if (ctx.tick - lastTick < event.cooldownTicks) return;

    this.lastEvaluated.set(event.id, ctx.tick);

    if (!event.canTrigger(ctx)) return;

    const message = event.execute(ctx);
    useLogStore.getState().addEntry("info", message, ["event", event.id]);
  }
}
