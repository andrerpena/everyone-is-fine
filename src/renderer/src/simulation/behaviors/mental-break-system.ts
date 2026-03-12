// =============================================================================
// MENTAL BREAK SYSTEM
// =============================================================================
// Monitors colonist mood and triggers/ends mental breaks.
// Supports: sad_wander, food_binge, daze.

import type { World } from "../../world/types";
import { getWorldTileAt } from "../../world/utils/tile-utils";
import { getAllowedTilesForCharacter } from "../../zones";
import type { EntityStore } from "../entity-store";
import type { JobProcessor } from "../jobs";
import { createForageJob } from "../jobs/job-factory";
import type { Job, MoveStep } from "../jobs/types";
import { generateJobId } from "../jobs/types";
import type { MovementSystem } from "../movement";
import { findPath } from "../pathfinding";
import { TICKS_PER_SECOND } from "../simulation-loop";
import type { EntityId, MentalBreakType } from "../types";

// =============================================================================
// CONSTANTS
// =============================================================================

/** Mood threshold to trigger a mental break */
export const MENTAL_BREAK_TRIGGER_THRESHOLD = 0.2;

/** Mood threshold to end a mental break (hysteresis) */
export const MENTAL_BREAK_RECOVERY_THRESHOLD = 0.3;

/** Wander cooldown during mental break (shorter than idle — more frantic) */
const BREAK_WANDER_COOLDOWN_MIN = 1;
const BREAK_WANDER_COOLDOWN_MAX = 3;

/** Wander radius during mental break */
const BREAK_WANDER_RADIUS = 6;

/** Search radius for food binge (larger than normal forage) */
const FOOD_BINGE_SEARCH_RADIUS = 30;

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
// MENTAL BREAK SYSTEM
// =============================================================================

/**
 * Monitors mood each tick. Triggers mental breaks when mood drops to critical,
 * ends them when mood recovers. During a break, assigns wander jobs.
 */
export class MentalBreakSystem {
  private entityStore: EntityStore;
  private jobProcessor: JobProcessor;
  private movementSystem: MovementSystem;
  private getWorld: () => World | null;

  /** Wander cooldown ticks per character during break */
  private cooldowns: Map<EntityId, number> = new Map();

  /** RNG seeds per character */
  private seeds: Map<EntityId, number> = new Map();

  constructor(
    entityStore: EntityStore,
    jobProcessor: JobProcessor,
    movementSystem: MovementSystem,
    getWorld: () => World | null,
  ) {
    this.entityStore = entityStore;
    this.jobProcessor = jobProcessor;
    this.movementSystem = movementSystem;
    this.getWorld = getWorld;
  }

  /**
   * Called every tick. Check for break triggers and manage active breaks.
   */
  update(currentTick: number): void {
    for (const character of this.entityStore.values()) {
      // Skip drafted characters — they are under direct player control
      if (character.control.mode === "drafted") continue;

      const mood = character.needs.mood;

      if (character.mentalBreak === null) {
        // Not in a break — check if we should trigger one
        if (mood < MENTAL_BREAK_TRIGGER_THRESHOLD) {
          this.triggerBreak(character.id, currentTick);
        }
      } else {
        // In a break — check if we should end it
        if (mood >= MENTAL_BREAK_RECOVERY_THRESHOLD) {
          this.endBreak(character.id);
        } else {
          // Still in break — assign wander behavior
          this.updateBreakBehavior(character.id);
        }
      }
    }
  }

  /**
   * Trigger a mental break for a character.
   */
  private triggerBreak(characterId: EntityId, currentTick: number): void {
    // Cancel any active jobs and movement
    this.jobProcessor.cancelJob(characterId);
    this.movementSystem.cancelMove(characterId);

    // Select break type using deterministic RNG
    const breakType = this.selectBreakType(characterId);

    // Set mental break state
    this.entityStore.update(characterId, {
      mentalBreak: { type: breakType, startedAtTick: currentTick },
    });

    // Reset cooldown (start behavior immediately)
    this.cooldowns.set(characterId, 0);
  }

  /**
   * Select a mental break type using deterministic RNG.
   * Distribution: sad_wander 50%, food_binge 30%, daze 20%.
   */
  private selectBreakType(characterId: EntityId): MentalBreakType {
    let seed = this.seeds.get(characterId) ?? this.hashId(characterId);
    seed = lcgNext(seed);
    this.seeds.set(characterId, seed);

    const roll = lcgFloat(seed);
    if (roll < 0.5) return "sad_wander";
    if (roll < 0.8) return "food_binge";
    return "daze";
  }

  /**
   * End a mental break.
   */
  private endBreak(characterId: EntityId): void {
    this.entityStore.update(characterId, {
      mentalBreak: null,
    });
    this.cooldowns.delete(characterId);
  }

  /**
   * During a break, dispatch to the appropriate behavior based on break type.
   */
  private updateBreakBehavior(characterId: EntityId): void {
    const character = this.entityStore.get(characterId);
    if (!character || !character.mentalBreak) return;

    switch (character.mentalBreak.type) {
      case "sad_wander":
        this.updateSadWanderBehavior(characterId);
        break;
      case "food_binge":
        this.updateFoodBingeBehavior(characterId);
        break;
      case "daze":
        // Daze: colonist stands still, does nothing
        break;
    }
  }

  /**
   * Sad wander: assign wander jobs (similar to idle but more frequent/erratic).
   */
  private updateSadWanderBehavior(characterId: EntityId): void {
    const character = this.entityStore.get(characterId);
    if (!character) return;

    if (character.movement.isMoving) return;
    if (this.jobProcessor.getJob(characterId)) return;

    const remaining = this.cooldowns.get(characterId) ?? 0;
    if (remaining > 0) {
      this.cooldowns.set(characterId, remaining - 1);
      return;
    }

    this.tryBreakWander(characterId);
  }

  /**
   * Food binge: compulsively seek and eat from bushes.
   */
  private updateFoodBingeBehavior(characterId: EntityId): void {
    const character = this.entityStore.get(characterId);
    if (!character) return;

    if (character.movement.isMoving) return;
    if (this.jobProcessor.getJob(characterId)) return;

    const remaining = this.cooldowns.get(characterId) ?? 0;
    if (remaining > 0) {
      this.cooldowns.set(characterId, remaining - 1);
      return;
    }

    this.tryFoodBinge(characterId);
  }

  /**
   * Pick a random nearby tile and create a wander job during break.
   */
  private tryBreakWander(characterId: EntityId): void {
    const character = this.entityStore.get(characterId);
    if (!character) return;

    const world = this.getWorld();
    if (!world) return;

    const { position } = character;

    // Advance RNG
    let seed = this.seeds.get(characterId) ?? this.hashId(characterId);
    seed = lcgNext(seed);
    const seed2 = lcgNext(seed);
    this.seeds.set(characterId, seed2);

    const angle = lcgFloat(seed) * Math.PI * 2;
    const dist = 1 + Math.floor(lcgFloat(seed2) * BREAK_WANDER_RADIUS);
    const targetX = position.x + Math.round(Math.cos(angle) * dist);
    const targetY = position.y + Math.round(Math.sin(angle) * dist);
    const target = { x: targetX, y: targetY, z: position.z };

    // Check if target tile is passable
    const tile = getWorldTileAt(world, targetX, targetY, position.z);
    if (!tile || !tile.pathfinding.isPassable) {
      this.cooldowns.set(characterId, this.randomCooldown(characterId));
      return;
    }

    // Check allowed area — skip target if outside allowed tiles
    const allowedTiles = getAllowedTilesForCharacter(character.allowedAreaId);
    if (allowedTiles && !allowedTiles.has(`${targetX},${targetY}`)) {
      this.cooldowns.set(characterId, this.randomCooldown(characterId));
      return;
    }

    // Find path
    const level = world.levels.get(position.z);
    if (!level) return;

    const result = findPath(level, position, target, { allowedTiles });
    if (!result.found) {
      this.cooldowns.set(characterId, this.randomCooldown(characterId));
      return;
    }

    // Create wander job
    const moveStep: MoveStep = {
      type: "move",
      destination: target,
      adjacent: false,
      status: "pending",
    };

    const job: Job = {
      id: generateJobId(),
      type: "sad_wander",
      characterId,
      targetPosition: target,
      steps: [moveStep],
      currentStepIndex: 0,
      status: "pending",
      createdAt: Date.now(),
    };

    this.jobProcessor.assignJob(job);
    this.cooldowns.set(characterId, this.randomCooldown(characterId));
  }

  /**
   * Food binge: find nearest bush and assign a forage job.
   * Falls back to sad wander if no bush is found.
   */
  private tryFoodBinge(characterId: EntityId): void {
    const character = this.entityStore.get(characterId);
    if (!character) return;

    const world = this.getWorld();
    if (!world) return;

    const { position } = character;
    const level = world.levels.get(position.z);
    if (!level) return;

    // Search for nearest bush
    let bestDist = Number.POSITIVE_INFINITY;
    let bestPos: { x: number; y: number; z: number } | null = null;

    const minX = Math.max(0, position.x - FOOD_BINGE_SEARCH_RADIUS);
    const maxX = Math.min(
      level.width - 1,
      position.x + FOOD_BINGE_SEARCH_RADIUS,
    );
    const minY = Math.max(0, position.y - FOOD_BINGE_SEARCH_RADIUS);
    const maxY = Math.min(
      level.height - 1,
      position.y + FOOD_BINGE_SEARCH_RADIUS,
    );

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const tile = getWorldTileAt(world, x, y, position.z);
        if (!tile || tile.structure?.type !== "bush") continue;

        // Skip tiles already reserved by another colonist
        const candidate = { x, y, z: position.z };
        if (this.jobProcessor.reservations.isReserved(candidate)) continue;

        const dist = Math.abs(x - position.x) + Math.abs(y - position.y);
        if (dist < bestDist) {
          bestDist = dist;
          bestPos = candidate;
        }
      }
    }

    if (bestPos) {
      // Assign forage job (eat compulsively)
      const job = createForageJob(characterId, bestPos);
      this.jobProcessor.assignJob(job);
      this.cooldowns.set(characterId, this.randomCooldown(characterId));
    } else {
      // No bush found — fall back to wandering
      this.tryBreakWander(characterId);
    }
  }

  private randomCooldown(characterId: EntityId): number {
    let seed = this.seeds.get(characterId) ?? this.hashId(characterId);
    seed = lcgNext(seed);
    this.seeds.set(characterId, seed);

    const range = BREAK_WANDER_COOLDOWN_MAX - BREAK_WANDER_COOLDOWN_MIN;
    const seconds = BREAK_WANDER_COOLDOWN_MIN + lcgFloat(seed) * range;
    return Math.floor(seconds * TICKS_PER_SECOND);
  }

  private hashId(id: string): number {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash * 31 + id.charCodeAt(i)) & 0x7fffffff;
    }
    return hash || 1;
  }
}
