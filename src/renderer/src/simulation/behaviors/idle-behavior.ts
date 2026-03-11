// =============================================================================
// IDLE BEHAVIOR SYSTEM
// =============================================================================
// Assigns idle colonists to wander to nearby tiles periodically

import type { World } from "../../world/types";
import { getWorldTileAt } from "../../world/utils/tile-utils";
import type { EntityStore } from "../entity-store";
import type { JobProcessor } from "../jobs";
import type { Job, MoveStep } from "../jobs/types";
import { generateJobId } from "../jobs/types";
import { findPath } from "../pathfinding";
import { TICKS_PER_SECOND } from "../simulation-loop";
import type { EntityId } from "../types";

// =============================================================================
// CONSTANTS
// =============================================================================

/** Minimum cooldown between wanders in seconds */
const MIN_WANDER_COOLDOWN = 3;

/** Maximum cooldown between wanders in seconds */
const MAX_WANDER_COOLDOWN = 8;

/** Maximum distance (in tiles) a colonist will wander from current position */
const WANDER_RADIUS = 4;

// =============================================================================
// SIMPLE LCG RNG (deterministic per-entity)
// =============================================================================

function lcgNext(seed: number): number {
  return ((seed * 1103515245 + 12345) & 0x7fffffff) >>> 0;
}

function lcgFloat(seed: number): number {
  return (seed & 0x7fffffff) / 0x7fffffff;
}

// =============================================================================
// IDLE BEHAVIOR SYSTEM
// =============================================================================

/**
 * Checks idle characters each tick and assigns wander jobs
 * after a random cooldown period.
 */
export class IdleBehaviorSystem {
  private entityStore: EntityStore;
  private jobProcessor: JobProcessor;
  private getWorld: () => World | null;

  /** Remaining cooldown ticks per character before next wander */
  private cooldowns: Map<EntityId, number> = new Map();

  /** RNG seed per character for deterministic wander directions */
  private seeds: Map<EntityId, number> = new Map();

  constructor(
    entityStore: EntityStore,
    jobProcessor: JobProcessor,
    getWorld: () => World | null,
  ) {
    this.entityStore = entityStore;
    this.jobProcessor = jobProcessor;
    this.getWorld = getWorld;
  }

  /**
   * Called every tick. Checks idle characters and assigns wander jobs.
   */
  update(): void {
    for (const character of this.entityStore.values()) {
      // Only wander if truly idle (no job, no movement, idle mode)
      if (character.control.mode !== "idle") continue;
      if (character.movement.isMoving) continue;
      if (this.jobProcessor.getJob(character.id)) continue;

      // Manage cooldown
      const remaining = this.cooldowns.get(character.id);
      if (remaining === undefined) {
        // First time seeing this idle character — start a cooldown
        this.cooldowns.set(character.id, this.randomCooldown(character.id));
        continue;
      }

      if (remaining > 0) {
        this.cooldowns.set(character.id, remaining - 1);
        continue;
      }

      // Cooldown expired — try to wander
      this.tryWander(character.id);
    }
  }

  /**
   * Pick a random nearby passable tile and create a move job.
   */
  private tryWander(characterId: EntityId): void {
    const character = this.entityStore.get(characterId);
    if (!character) return;

    const world = this.getWorld();
    if (!world) return;

    const { position } = character;

    // Advance RNG
    let seed = this.seeds.get(characterId) ?? this.hashId(characterId);
    seed = lcgNext(seed);
    this.seeds.set(characterId, seed);

    // Pick a random offset within wander radius
    const seed2 = lcgNext(seed);
    this.seeds.set(characterId, seed2);

    const angle = lcgFloat(seed) * Math.PI * 2;
    const dist = 1 + Math.floor(lcgFloat(seed2) * WANDER_RADIUS);
    const targetX = position.x + Math.round(Math.cos(angle) * dist);
    const targetY = position.y + Math.round(Math.sin(angle) * dist);
    const target = { x: targetX, y: targetY, z: position.z };

    // Check if target tile is passable
    const tile = getWorldTileAt(world, targetX, targetY, position.z);
    if (!tile || !tile.pathfinding.isPassable) {
      // Pick a new cooldown and try again next time
      this.cooldowns.set(characterId, this.randomCooldown(characterId));
      return;
    }

    // Find path
    const level = world.levels.get(position.z);
    if (!level) return;

    const result = findPath(level, position, target);
    if (!result.found) {
      this.cooldowns.set(characterId, this.randomCooldown(characterId));
      return;
    }

    // Create a simple wander job (single move step)
    const moveStep: MoveStep = {
      type: "move",
      destination: target,
      adjacent: false,
      status: "pending",
    };

    const job: Job = {
      id: generateJobId(),
      type: "wander",
      characterId,
      targetPosition: target,
      steps: [moveStep],
      currentStepIndex: 0,
      status: "pending",
      createdAt: Date.now(),
    };

    this.jobProcessor.assignJob(job);

    // Reset cooldown for after wander completes
    this.cooldowns.set(characterId, this.randomCooldown(characterId));
  }

  /**
   * Generate a random cooldown in ticks using deterministic RNG.
   */
  private randomCooldown(characterId: EntityId): number {
    let seed = this.seeds.get(characterId) ?? this.hashId(characterId);
    seed = lcgNext(seed);
    this.seeds.set(characterId, seed);

    const range = MAX_WANDER_COOLDOWN - MIN_WANDER_COOLDOWN;
    const seconds = MIN_WANDER_COOLDOWN + lcgFloat(seed) * range;
    return Math.floor(seconds * TICKS_PER_SECOND);
  }

  /**
   * Simple hash of entity ID string to seed the RNG.
   */
  private hashId(id: string): number {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash * 31 + id.charCodeAt(i)) & 0x7fffffff;
    }
    return hash || 1;
  }
}
