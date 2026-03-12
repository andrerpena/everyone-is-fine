// =============================================================================
// EVENT DEFINITIONS
// =============================================================================
// Data-driven event definitions with condition checkers and effect handlers.
// Each event specifies when it can trigger and what happens when it does.

import { useGameColorStore } from "../../theming/game-color-store";
import type { SeededRandom } from "../../world/factories/world-factory";
import type { World } from "../../world/types";
import { generateColonistIdentity } from "../colonist-generator";
import type { EntityStore } from "../entity-store";
import { type Character, createCharacter } from "../types";

// =============================================================================
// TYPES
// =============================================================================

export interface EventContext {
  readonly entityStore: EntityStore;
  readonly world: World;
  readonly rng: SeededRandom;
  readonly tick: number;
  readonly addCharacter: (character: Character) => void;
}

export interface EventDefinition {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  /** Minimum ticks between evaluations of this event */
  readonly cooldownTicks: number;
  /** Check whether the event can trigger. Return true if eligible. */
  readonly canTrigger: (ctx: EventContext) => boolean;
  /** Execute the event's effects. Return a human-readable log message. */
  readonly execute: (ctx: EventContext) => string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Maximum colony size before wanderers stop arriving */
export const WANDERER_MAX_COLONY_SIZE = 8;

/** Per-evaluation chance that a wanderer event fires (when eligible) */
export const WANDERER_CHANCE = 0.08;

// =============================================================================
// WANDERER JOINS EVENT
// =============================================================================

export const wandererJoinsEvent: EventDefinition = {
  id: "wanderer_joins",
  label: "Wanderer Joins",
  description:
    "A wanderer appears at the edge of the map and joins the colony.",
  cooldownTicks: 600,

  canTrigger(ctx: EventContext): boolean {
    const colonistCount = ctx.entityStore.size;
    if (colonistCount >= WANDERER_MAX_COLONY_SIZE) return false;
    return ctx.rng.chance(WANDERER_CHANCE);
  },

  execute(ctx: EventContext): string {
    const identity = generateColonistIdentity(ctx.rng);

    const level = ctx.world.levels.get(ctx.world.surfaceZ);
    const width = level?.width ?? ctx.world.dimensions.width;
    const height = level?.height ?? ctx.world.dimensions.height;

    // Spawn at a random edge position
    const edge = ctx.rng.nextInt(0, 4); // 0=top, 1=right, 2=bottom, 3=left
    let x: number;
    let y: number;
    switch (edge) {
      case 0:
        x = ctx.rng.nextInt(0, width);
        y = 0;
        break;
      case 1:
        x = width - 1;
        y = ctx.rng.nextInt(0, height);
        break;
      case 2:
        x = ctx.rng.nextInt(0, width);
        y = height - 1;
        break;
      default:
        x = 0;
        y = ctx.rng.nextInt(0, height);
        break;
    }

    const { colonistFallback } =
      useGameColorStore.getState().resolved.characters;

    const character = createCharacter({
      name: identity.name,
      biography: identity.biography,
      skills: identity.skills,
      traits: identity.traits,
      position: { x, y, z: ctx.world.surfaceZ },
      color: colonistFallback,
    });

    ctx.addCharacter(character);

    return `A wanderer named ${identity.name} has joined the colony.`;
  },
};

// =============================================================================
// EVENT REGISTRY
// =============================================================================

export const ALL_EVENTS: readonly EventDefinition[] = [wandererJoinsEvent];
