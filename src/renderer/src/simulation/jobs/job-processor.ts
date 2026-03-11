// =============================================================================
// JOB PROCESSOR - Tick-driven job execution engine
// =============================================================================

import { logger } from "../../lib/logger";
import { FLOOR_REGISTRY } from "../../world/registries/floor-registry";
import { ITEM_REGISTRY } from "../../world/registries/item-registry";
import { STRUCTURE_REGISTRY } from "../../world/registries/structure-registry";
import { TERRAIN_REGISTRY } from "../../world/registries/terrain-registry";
import type {
  ItemData,
  ItemType,
  Position2D,
  Position3D,
  Tile,
  World,
} from "../../world/types";
import {
  addItemToTile,
  getWorldTileAt,
  removeItemFromTile,
} from "../../world/utils/tile-utils";
import type { EntityStore } from "../entity-store";
import type { MovementSystem } from "../movement";
import { findPath } from "../pathfinding";
import { CROP_REGISTRY } from "../plants/crop-registry";
import { calculateQualityFromSkill } from "../quality";
import {
  BASE_WORK_XP,
  getWorkSpeedMultiplier,
  grantExperience,
  JOB_SKILL_MAP,
} from "../skills";
import { createMoveCommand, type EntityId } from "../types";
import { ReservationSystem } from "./reservation-system";
import type {
  ConsumeItemStep,
  DropItemStep,
  HarvestCropStep,
  Job,
  JobProgressInfo,
  MoveStep,
  PickupItemStep,
  PlaceFloorStep,
  PlaceStructureStep,
  PlantCropStep,
  RestoreNeedStep,
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
  /** Items currently being carried by characters (picked up but not yet dropped) */
  private carriedItems: Map<EntityId, ItemData> = new Map();
  readonly reservations = new ReservationSystem();

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
    this.reservations.reserve(job.targetPosition, job.characterId);

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
    this.reservations.release(job.targetPosition);
    this.dropCarriedItemOnGround(characterId);

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
          // Apply skill-based speed multiplier
          const skillId = JOB_SKILL_MAP[job.type];
          const character = this.entityStore.get(characterId);
          const multiplier =
            skillId && character
              ? getWorkSpeedMultiplier(character.skills[skillId].level)
              : 1;
          step.ticksWorked += multiplier;

          if (step.ticksWorked >= step.totalTicks) {
            step.status = "completed";
            // Grant XP to the relevant skill on work completion
            if (skillId && character) {
              const result = grantExperience(
                character.skills,
                skillId,
                BASE_WORK_XP,
              );
              this.entityStore.update(characterId, {
                skills: result.skills,
              });
            }
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

      case "restore_need":
        this.executeRestoreNeed(characterId, step);
        step.status = "completed";
        this.advanceToNextStep(characterId, job);
        break;

      case "pickup_item":
        this.executePickupItem(characterId, job, step);
        break;

      case "drop_item":
        this.executeDropItem(characterId, job, step);
        break;

      case "plant_crop":
        this.executePlantCrop(characterId, job, step);
        break;

      case "harvest_crop":
        this.executeHarvestCrop(characterId, job, step);
        break;

      case "consume_item":
        this.executeConsumeItem(characterId, job, step);
        break;

      case "place_structure":
        this.executePlaceStructure(characterId, job, step);
        break;

      case "place_floor":
        this.executePlaceFloor(characterId, job, step);
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
    const updates: Partial<Tile> = {};

    if (step.removeStructure) {
      updates.structure = null;
      updates.pathfinding = {
        isPassable: true,
        movementCost: 1,
        lastUpdated: Date.now(),
      };
    }

    if (step.newTerrain) {
      const terrainProps = TERRAIN_REGISTRY[step.newTerrain];
      updates.terrain = {
        type: step.newTerrain,
        moisture: 0,
        temperature: 0,
      };
      updates.pathfinding = {
        isPassable: terrainProps.isPassable,
        movementCost: terrainProps.movementCost,
        lastUpdated: Date.now(),
      };
    }

    if (Object.keys(updates).length > 0) {
      this.updateTile(
        { x: step.position.x, y: step.position.y },
        step.position.z,
        updates,
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
        condition: 1,
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
  // RESTORE NEED STEP
  // ===========================================================================

  private executeRestoreNeed(
    characterId: EntityId,
    step: RestoreNeedStep,
  ): void {
    const character = this.entityStore.get(characterId);
    if (!character) return;

    const needs = character.needs;
    const currentValue =
      step.needId in needs
        ? (needs[step.needId as keyof typeof needs] as number)
        : 0;
    const newValue = Math.min(1, currentValue + step.amount);
    this.entityStore.update(characterId, {
      needs: { ...needs, [step.needId]: newValue },
    });
  }

  // ===========================================================================
  // PICKUP ITEM STEP
  // ===========================================================================

  private executePickupItem(
    characterId: EntityId,
    job: Job,
    step: PickupItemStep,
  ): void {
    const world = this.getWorld();
    if (!world) {
      this.failJob(characterId, job, "World not initialized");
      return;
    }

    const tile = getWorldTileAt(
      world,
      step.position.x,
      step.position.y,
      step.position.z,
    );
    if (!tile) {
      this.failJob(characterId, job, "Source tile not found");
      return;
    }

    const item = removeItemFromTile(tile, step.itemId);
    if (!item) {
      // Item already gone (picked up by someone else or deteriorated)
      this.failJob(characterId, job, "Item no longer exists at source");
      return;
    }

    this.carriedItems.set(characterId, item);

    // Notify store so rendering updates
    this.updateTile(
      { x: step.position.x, y: step.position.y },
      step.position.z,
      {},
    );

    step.status = "completed";
    this.advanceToNextStep(characterId, job);
  }

  // ===========================================================================
  // DROP ITEM STEP
  // ===========================================================================

  private executeDropItem(
    characterId: EntityId,
    job: Job,
    step: DropItemStep,
  ): void {
    const carried = this.carriedItems.get(characterId);
    if (!carried) {
      this.failJob(characterId, job, "No item being carried");
      return;
    }

    const world = this.getWorld();
    if (!world) {
      this.failJob(characterId, job, "World not initialized");
      return;
    }

    const tile = getWorldTileAt(
      world,
      step.position.x,
      step.position.y,
      step.position.z,
    );
    if (!tile) {
      this.failJob(characterId, job, "Destination tile not found");
      return;
    }

    addItemToTile(tile, carried);
    this.carriedItems.delete(characterId);

    // Notify store so rendering updates
    this.updateTile(
      { x: step.position.x, y: step.position.y },
      step.position.z,
      {},
    );

    step.status = "completed";
    this.advanceToNextStep(characterId, job);
  }

  // ===========================================================================
  // PLANT CROP STEP
  // ===========================================================================

  private executePlantCrop(
    characterId: EntityId,
    job: Job,
    step: PlantCropStep,
  ): void {
    const world = this.getWorld();
    if (!world) {
      this.failJob(characterId, job, "World not initialized");
      return;
    }

    const tile = getWorldTileAt(
      world,
      step.position.x,
      step.position.y,
      step.position.z,
    );
    if (!tile) {
      this.failJob(characterId, job, "Tile not found");
      return;
    }

    // Plant the crop
    tile.crop = {
      type: step.cropType,
      growthProgress: 0,
      stage: "seedling",
      plantedDay: world.time.day,
    };

    // Notify store so rendering updates
    this.updateTile(
      { x: step.position.x, y: step.position.y },
      step.position.z,
      {},
    );

    step.status = "completed";
    this.advanceToNextStep(characterId, job);
  }

  // ===========================================================================
  // HARVEST CROP STEP
  // ===========================================================================

  private executeHarvestCrop(
    characterId: EntityId,
    job: Job,
    step: HarvestCropStep,
  ): void {
    const world = this.getWorld();
    if (!world) {
      this.failJob(characterId, job, "World not initialized");
      return;
    }

    const tile = getWorldTileAt(
      world,
      step.position.x,
      step.position.y,
      step.position.z,
    );
    if (!tile) {
      this.failJob(characterId, job, "Tile not found");
      return;
    }

    if (!tile.crop || tile.crop.stage !== "mature") {
      this.failJob(characterId, job, "No mature crop to harvest");
      return;
    }

    // Look up yield from crop registry
    const props = CROP_REGISTRY[step.cropType];

    // Remove the crop
    tile.crop = null;

    // Spawn yield items
    addItemToTile(tile, {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: props.yieldType,
      quantity: props.yieldQuantity,
      quality: 1,
      condition: 1,
    });

    // Notify store so rendering updates
    this.updateTile(
      { x: step.position.x, y: step.position.y },
      step.position.z,
      {},
    );

    step.status = "completed";
    this.advanceToNextStep(characterId, job);
  }

  // ===========================================================================
  // PLACE STRUCTURE STEP
  // ===========================================================================

  private executePlaceStructure(
    characterId: EntityId,
    job: Job,
    step: PlaceStructureStep,
  ): void {
    const world = this.getWorld();
    if (!world) {
      this.failJob(characterId, job, "World not initialized");
      return;
    }

    const tile = getWorldTileAt(
      world,
      step.position.x,
      step.position.y,
      step.position.z,
    );
    if (!tile) {
      this.failJob(characterId, job, "Tile not found");
      return;
    }

    // Calculate build quality from constructor's skill
    const character = this.entityStore.get(characterId);
    const constructionLevel = character?.skills.construction?.level ?? 0;
    const quality = calculateQualityFromSkill(constructionLevel);

    // Place the structure
    const props = STRUCTURE_REGISTRY[step.structureType];
    tile.structure = {
      type: step.structureType,
      health: props.maxHealth,
      quality,
      rotation: 0,
    };

    // Clear the blueprint
    tile.blueprint = null;

    // Update pathfinding if structure blocks movement
    if (props.blocksMovement) {
      tile.pathfinding = {
        isPassable: false,
        movementCost: tile.pathfinding.movementCost,
        lastUpdated: Date.now(),
      };
    }

    // Notify store so rendering updates
    this.updateTile(
      { x: step.position.x, y: step.position.y },
      step.position.z,
      {},
    );

    step.status = "completed";
    this.advanceToNextStep(characterId, job);
  }

  // ===========================================================================
  // PLACE FLOOR STEP
  // ===========================================================================

  private executePlaceFloor(
    characterId: EntityId,
    job: Job,
    step: PlaceFloorStep,
  ): void {
    const world = this.getWorld();
    if (!world) {
      this.failJob(characterId, job, "World not initialized");
      return;
    }

    const tile = getWorldTileAt(
      world,
      step.position.x,
      step.position.y,
      step.position.z,
    );
    if (!tile) {
      this.failJob(characterId, job, "Tile not found");
      return;
    }

    // Place the floor
    const floorProps = FLOOR_REGISTRY[step.floorType];
    tile.floor = {
      type: step.floorType,
      condition: 1.0,
    };

    // Update pathfinding with floor movement cost
    tile.pathfinding = {
      isPassable: tile.pathfinding.isPassable,
      movementCost: floorProps.movementCost,
      lastUpdated: Date.now(),
    };

    // Notify store so rendering updates
    this.updateTile(
      { x: step.position.x, y: step.position.y },
      step.position.z,
      {},
    );

    step.status = "completed";
    this.advanceToNextStep(characterId, job);
  }

  // ===========================================================================
  // CONSUME ITEM STEP
  // ===========================================================================

  private executeConsumeItem(
    characterId: EntityId,
    job: Job,
    step: ConsumeItemStep,
  ): void {
    const carried = this.carriedItems.get(characterId);
    if (!carried) {
      this.failJob(characterId, job, "No item being carried to consume");
      return;
    }

    const character = this.entityStore.get(characterId);
    if (!character) {
      this.failJob(characterId, job, "Character not found");
      return;
    }

    // Look up nutrition from item registry
    const props = ITEM_REGISTRY[carried.type];
    const amount = props.nutrition;

    // Restore the need
    const needs = character.needs;
    const currentValue =
      step.needId in needs
        ? (needs[step.needId as keyof typeof needs] as number)
        : 0;
    const newValue = Math.min(1, currentValue + amount);
    this.entityStore.update(characterId, {
      needs: { ...needs, [step.needId]: newValue },
    });

    // Item is consumed — remove from carried items
    this.carriedItems.delete(characterId);

    step.status = "completed";
    this.advanceToNextStep(characterId, job);
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
    this.reservations.release(job.targetPosition);

    logger.debug(`Job completed: ${job.type} for ${characterId}`, ["jobs"]);
  }

  private failJob(characterId: EntityId, job: Job, reason: string): void {
    job.status = "failed";
    const step = job.steps[job.currentStepIndex];
    if (step) step.status = "failed";
    this.activeJobs.delete(characterId);
    this.reservations.release(job.targetPosition);
    this.dropCarriedItemOnGround(characterId);

    logger.warn(`Job failed: ${job.type} for ${characterId} — ${reason}`, [
      "jobs",
    ]);
  }

  /**
   * If a character is carrying an item (mid-haul), drop it at their current position.
   * Called when a job is cancelled or fails.
   */
  private dropCarriedItemOnGround(characterId: EntityId): void {
    const carried = this.carriedItems.get(characterId);
    if (!carried) return;

    const character = this.entityStore.get(characterId);
    const world = this.getWorld();
    if (character && world) {
      const tile = getWorldTileAt(
        world,
        character.position.x,
        character.position.y,
        character.position.z,
      );
      if (tile) {
        addItemToTile(tile, carried);
        this.updateTile(
          { x: character.position.x, y: character.position.y },
          character.position.z,
          {},
        );
      }
    }

    this.carriedItems.delete(characterId);
  }
}
