// =============================================================================
// JOB PROCESSOR - Tick-driven job execution engine
// =============================================================================

import { logger } from "../../lib/logger";
import type {
  ItemType,
  Position2D,
  Position3D,
  Tile,
  World,
} from "../../world/types";
import { addItemToTile, getWorldTileAt } from "../../world/utils/tile-utils";
import type { EntityStore } from "../entity-store";
import type { MovementSystem } from "../movement";
import { findPath } from "../pathfinding";
import { createMoveCommand, type EntityId } from "../types";
import type {
  Job,
  JobProgressInfo,
  MoveStep,
  SpawnItemsStep,
  TransformTileStep,
} from "./types";

// =============================================================================
// ADJACENT TILE HELPERS
// =============================================================================

/** Cardinal + diagonal offsets for finding adjacent tiles */
const NEIGHBOR_OFFSETS = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: 1, dy: -1 },
  { dx: 1, dy: 1 },
  { dx: -1, dy: 1 },
  { dx: -1, dy: -1 },
];

/**
 * Find the nearest passable adjacent tile to a target.
 * Prefers cardinal directions, then diagonals.
 */
function findAdjacentPassableTile(
  world: World,
  target: Position3D,
  characterPosition: Position3D,
): Position3D | null {
  let best: Position3D | null = null;
  let bestDist = Number.POSITIVE_INFINITY;

  for (const { dx, dy } of NEIGHBOR_OFFSETS) {
    const nx = target.x + dx;
    const ny = target.y + dy;
    const tile = getWorldTileAt(world, nx, ny, target.z);

    if (tile?.pathfinding.isPassable) {
      const dist =
        Math.abs(nx - characterPosition.x) + Math.abs(ny - characterPosition.y);
      if (dist < bestDist) {
        bestDist = dist;
        best = { x: nx, y: ny, z: target.z };
      }
    }
  }

  return best;
}

// =============================================================================
// JOB PROCESSOR CLASS
// =============================================================================

export class JobProcessor {
  private activeJobs: Map<EntityId, Job> = new Map();

  constructor(
    private entityStore: EntityStore,
    private movementSystem: MovementSystem,
    private getWorld: () => World | null,
    private updateTile: (
      position: Position2D,
      zLevel: number,
      changes: Partial<Tile>,
    ) => void,
  ) {
    // Hook into movement completion to advance move steps
    this.movementSystem.onMovementComplete = (id, _character) => {
      this.onMovementComplete(id);
    };
  }

  /** Assign a job to a character, cancelling any existing job */
  assignJob(job: Job): void {
    const existing = this.activeJobs.get(job.characterId);
    if (existing && existing.status === "active") {
      this.cancelJob(job.characterId);
    }

    job.status = "active";
    this.activeJobs.set(job.characterId, job);

    logger.debug(
      `Job assigned: ${job.type} to ${job.characterId} at (${job.targetPosition.x},${job.targetPosition.y})`,
      ["jobs"],
    );
  }

  /** Cancel the active job for a character */
  cancelJob(characterId: EntityId): void {
    const job = this.activeJobs.get(characterId);
    if (!job) return;

    job.status = "cancelled";
    this.activeJobs.delete(characterId);

    // Stop any in-progress movement
    this.movementSystem.cancelMove(characterId);

    logger.debug(`Job cancelled: ${job.type} for ${characterId}`, ["jobs"]);
  }

  /** Get the active job for a character */
  getJob(characterId: EntityId): Job | undefined {
    return this.activeJobs.get(characterId);
  }

  /** Get progress snapshots for all active jobs (for rendering) */
  getActiveJobProgress(): Map<EntityId, JobProgressInfo> {
    const result = new Map<EntityId, JobProgressInfo>();
    for (const [characterId, job] of this.activeJobs) {
      if (job.status !== "active") continue;
      const step = job.steps[job.currentStepIndex];
      let progress: number | null = null;
      if (step && step.type === "work" && step.status === "active") {
        progress = step.ticksWorked / step.totalTicks;
      }
      result.set(characterId, {
        characterId,
        jobType: job.type,
        targetPosition: job.targetPosition,
        progress,
      });
    }
    return result;
  }

  /** Called every tick to advance active jobs */
  update(_deltaTime: number): void {
    for (const [characterId, job] of this.activeJobs) {
      if (job.status !== "active") continue;
      this.processCurrentStep(characterId, job);
    }
  }

  // ===========================================================================
  // STEP PROCESSING
  // ===========================================================================

  private processCurrentStep(characterId: EntityId, job: Job): void {
    const step = job.steps[job.currentStepIndex];
    if (!step) {
      this.completeJob(characterId, job);
      return;
    }

    switch (step.type) {
      case "move":
        if (step.status === "pending") {
          this.initiateMove(characterId, job, step);
        }
        // Move completion handled by onMovementComplete callback
        break;

      case "work":
        if (step.status === "pending") {
          step.status = "active";
        }
        if (step.status === "active") {
          step.ticksWorked++;
          if (step.ticksWorked >= step.totalTicks) {
            step.status = "completed";
            this.advanceToNextStep(characterId, job);
          }
        }
        break;

      case "transform_tile":
        this.executeTransformTile(step);
        step.status = "completed";
        this.advanceToNextStep(characterId, job);
        break;

      case "spawn_items":
        this.executeSpawnItems(step);
        step.status = "completed";
        this.advanceToNextStep(characterId, job);
        break;
    }
  }

  // ===========================================================================
  // MOVE STEP
  // ===========================================================================

  private initiateMove(characterId: EntityId, job: Job, step: MoveStep): void {
    const character = this.entityStore.get(characterId);
    if (!character) {
      this.failJob(characterId, job, "Character not found");
      return;
    }

    const world = this.getWorld();
    if (!world) {
      this.failJob(characterId, job, "World not initialized");
      return;
    }

    // Determine actual destination
    let destination = step.destination;
    if (step.adjacent) {
      const adjacent = findAdjacentPassableTile(
        world,
        step.destination,
        character.position,
      );
      if (!adjacent) {
        this.failJob(characterId, job, "No passable adjacent tile");
        return;
      }
      destination = adjacent;
    }

    // Check if already at destination
    if (
      character.position.x === destination.x &&
      character.position.y === destination.y &&
      character.position.z === destination.z
    ) {
      step.status = "completed";
      this.advanceToNextStep(characterId, job);
      return;
    }

    // Find path
    const level = world.levels.get(destination.z);
    if (!level) {
      this.failJob(characterId, job, "Level not found");
      return;
    }

    const result = findPath(level, character.position, destination);
    if (!result.found) {
      this.failJob(
        characterId,
        job,
        `No path to (${destination.x},${destination.y})`,
      );
      return;
    }

    // Issue move command via movement system
    const moveCmd = createMoveCommand(destination, { path: result.path });
    this.movementSystem.issueMove(characterId, moveCmd);
    step.status = "active";
  }

  private onMovementComplete(characterId: EntityId): void {
    const job = this.activeJobs.get(characterId);
    if (!job || job.status !== "active") return;

    const step = job.steps[job.currentStepIndex];
    if (step && step.type === "move" && step.status === "active") {
      step.status = "completed";
      this.advanceToNextStep(characterId, job);
    }
  }

  // ===========================================================================
  // TILE TRANSFORM STEP
  // ===========================================================================

  private executeTransformTile(step: TransformTileStep): void {
    if (step.removeStructure) {
      this.updateTile(
        { x: step.position.x, y: step.position.y },
        step.position.z,
        {
          structure: null,
          pathfinding: {
            isPassable: true,
            movementCost: 1,
            lastUpdated: Date.now(),
          },
        },
      );
    }
  }

  // ===========================================================================
  // SPAWN ITEMS STEP
  // ===========================================================================

  private executeSpawnItems(step: SpawnItemsStep): void {
    const world = this.getWorld();
    if (!world) return;

    const tile = getWorldTileAt(
      world,
      step.position.x,
      step.position.y,
      step.position.z,
    );
    if (!tile) return;

    for (const itemDef of step.items) {
      addItemToTile(tile, {
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type: itemDef.type as ItemType,
        quantity: itemDef.quantity,
        quality: 1,
      });
    }

    // Notify store so rendering updates (tile items already mutated in place)
    this.updateTile(
      { x: step.position.x, y: step.position.y },
      step.position.z,
      {},
    );
  }

  // ===========================================================================
  // JOB LIFECYCLE
  // ===========================================================================

  private advanceToNextStep(characterId: EntityId, job: Job): void {
    job.currentStepIndex++;
    if (job.currentStepIndex >= job.steps.length) {
      this.completeJob(characterId, job);
    }
  }

  private completeJob(characterId: EntityId, job: Job): void {
    job.status = "completed";
    this.activeJobs.delete(characterId);

    logger.debug(`Job completed: ${job.type} for ${characterId}`, ["jobs"]);
  }

  private failJob(characterId: EntityId, job: Job, reason: string): void {
    job.status = "failed";
    const step = job.steps[job.currentStepIndex];
    if (step) step.status = "failed";
    this.activeJobs.delete(characterId);

    logger.warn(`Job failed: ${job.type} for ${characterId} — ${reason}`, [
      "jobs",
    ]);
  }
}
