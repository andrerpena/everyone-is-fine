// =============================================================================
// JOB FACTORY - Creates concrete job instances
// =============================================================================

import { getConstructionCost } from "../../world/registries/construction-registry";
import type { CropType, Position3D, StructureType } from "../../world/types";
import type { EntityId } from "../types";
import { generateJobId, type Job } from "./types";

/**
 * Create a "chop tree" job.
 * Steps: move adjacent → work 300 ticks (~5s at 60 TPS) → remove structure → spawn wood
 */
export function createChopJob(characterId: EntityId, target: Position3D): Job {
  return {
    id: generateJobId(),
    type: "chop",
    characterId,
    targetPosition: target,
    currentStepIndex: 0,
    status: "pending",
    createdAt: Date.now(),
    steps: [
      { type: "move", destination: target, adjacent: true, status: "pending" },
      {
        type: "work",
        totalTicks: 300,
        ticksWorked: 0,
        status: "pending",
      },
      {
        type: "transform_tile",
        position: target,
        removeStructure: true,
        status: "pending",
      },
      {
        type: "spawn_items",
        position: target,
        items: [{ type: "wood", quantity: 25 }],
        status: "pending",
      },
    ],
  };
}

/**
 * Create a "mine boulder" job.
 * Steps: move adjacent → work 480 ticks (~8s at 60 TPS) → remove structure → spawn stone
 */
export function createMineJob(characterId: EntityId, target: Position3D): Job {
  return {
    id: generateJobId(),
    type: "mine",
    characterId,
    targetPosition: target,
    currentStepIndex: 0,
    status: "pending",
    createdAt: Date.now(),
    steps: [
      { type: "move", destination: target, adjacent: true, status: "pending" },
      {
        type: "work",
        totalTicks: 480,
        ticksWorked: 0,
        status: "pending",
      },
      {
        type: "transform_tile",
        position: target,
        removeStructure: true,
        status: "pending",
      },
      {
        type: "spawn_items",
        position: target,
        items: [{ type: "stone", quantity: 20 }],
        status: "pending",
      },
    ],
  };
}

/**
 * Create a "forage berry bush" job.
 * Steps: move adjacent → work 120 ticks (~2s at 60 TPS) → restore hunger 0.3
 * Bush is NOT destroyed (renewable resource).
 */
export function createForageJob(
  characterId: EntityId,
  target: Position3D,
): Job {
  return {
    id: generateJobId(),
    type: "forage",
    characterId,
    targetPosition: target,
    currentStepIndex: 0,
    status: "pending",
    createdAt: Date.now(),
    steps: [
      { type: "move", destination: target, adjacent: true, status: "pending" },
      {
        type: "work",
        totalTicks: 120,
        ticksWorked: 0,
        status: "pending",
      },
      {
        type: "restore_need",
        needId: "hunger",
        amount: 0.3,
        status: "pending",
      },
    ],
  };
}

/**
 * Create a "sleep on the ground" job.
 * Steps: work 600 ticks (~10s at 60 TPS) → restore energy 0.5
 * No movement — colonist sleeps where they stand.
 */
export function createSleepJob(characterId: EntityId, target: Position3D): Job {
  return {
    id: generateJobId(),
    type: "sleep",
    characterId,
    targetPosition: target,
    currentStepIndex: 0,
    status: "pending",
    createdAt: Date.now(),
    steps: [
      {
        type: "work",
        totalTicks: 600,
        ticksWorked: 0,
        status: "pending",
      },
      {
        type: "restore_need",
        needId: "energy",
        amount: 0.5,
        status: "pending",
      },
    ],
  };
}

/**
 * Create a simple "move" job.
 * Steps: move to destination
 */
export function createMoveJob(characterId: EntityId, target: Position3D): Job {
  return {
    id: generateJobId(),
    type: "move",
    characterId,
    targetPosition: target,
    currentStepIndex: 0,
    status: "pending",
    createdAt: Date.now(),
    steps: [
      {
        type: "move",
        destination: target,
        adjacent: false,
        status: "pending",
      },
    ],
  };
}

/**
 * Create a "sow crop" job.
 * Steps: move to tile → work 150 ticks (~2.5s at 60 TPS) → plant crop
 */
export function createSowJob(
  characterId: EntityId,
  target: Position3D,
  cropType: CropType,
): Job {
  return {
    id: generateJobId(),
    type: "sow",
    characterId,
    targetPosition: target,
    currentStepIndex: 0,
    status: "pending",
    createdAt: Date.now(),
    steps: [
      {
        type: "move",
        destination: target,
        adjacent: false,
        status: "pending",
      },
      {
        type: "work",
        totalTicks: 150,
        ticksWorked: 0,
        status: "pending",
      },
      {
        type: "plant_crop",
        position: target,
        cropType,
        status: "pending",
      },
    ],
  };
}

/**
 * Create a "harvest crop" job.
 * Steps: move adjacent → work 180 ticks (~3s at 60 TPS) → harvest crop (remove + spawn yield)
 */
export function createHarvestJob(
  characterId: EntityId,
  target: Position3D,
  cropType: CropType,
): Job {
  return {
    id: generateJobId(),
    type: "harvest",
    characterId,
    targetPosition: target,
    currentStepIndex: 0,
    status: "pending",
    createdAt: Date.now(),
    steps: [
      {
        type: "move",
        destination: target,
        adjacent: true,
        status: "pending",
      },
      {
        type: "work",
        totalTicks: 180,
        ticksWorked: 0,
        status: "pending",
      },
      {
        type: "harvest_crop",
        position: target,
        cropType,
        status: "pending",
      },
    ],
  };
}

/**
 * Create a "build structure" job.
 * Steps: move adjacent → work (variable ticks based on structure type) → place structure
 */
export function createBuildJob(
  characterId: EntityId,
  target: Position3D,
  structureType: StructureType,
): Job {
  const cost = getConstructionCost(structureType);
  const workTicks = cost?.workTicks ?? 300;

  return {
    id: generateJobId(),
    type: "build",
    characterId,
    targetPosition: target,
    currentStepIndex: 0,
    status: "pending",
    createdAt: Date.now(),
    steps: [
      {
        type: "move",
        destination: target,
        adjacent: true,
        status: "pending",
      },
      {
        type: "work",
        totalTicks: workTicks,
        ticksWorked: 0,
        status: "pending",
      },
      {
        type: "place_structure",
        position: target,
        structureType,
        status: "pending",
      },
    ],
  };
}

/**
 * Create an "eat food" job.
 * Steps: move to food tile → pick up item → work 60 ticks (~1s eating) → consume item (restores hunger)
 */
export function createEatJob(
  characterId: EntityId,
  target: Position3D,
  itemId: string,
): Job {
  return {
    id: generateJobId(),
    type: "eat",
    characterId,
    targetPosition: target,
    currentStepIndex: 0,
    status: "pending",
    createdAt: Date.now(),
    steps: [
      {
        type: "move",
        destination: target,
        adjacent: false,
        status: "pending",
      },
      {
        type: "pickup_item",
        position: target,
        itemId,
        status: "pending",
      },
      {
        type: "work",
        totalTicks: 60,
        ticksWorked: 0,
        status: "pending",
      },
      {
        type: "consume_item",
        needId: "hunger",
        status: "pending",
      },
    ],
  };
}

/**
 * Create a "haul item" job.
 * Steps: move to source → pick up item → move to destination → drop item
 */
export function createHaulJob(
  characterId: EntityId,
  sourcePos: Position3D,
  destPos: Position3D,
  itemId: string,
): Job {
  return {
    id: generateJobId(),
    type: "haul",
    characterId,
    targetPosition: sourcePos,
    currentStepIndex: 0,
    status: "pending",
    createdAt: Date.now(),
    steps: [
      {
        type: "move",
        destination: sourcePos,
        adjacent: false,
        status: "pending",
      },
      {
        type: "pickup_item",
        position: sourcePos,
        itemId,
        status: "pending",
      },
      {
        type: "move",
        destination: destPos,
        adjacent: false,
        status: "pending",
      },
      {
        type: "drop_item",
        position: destPos,
        status: "pending",
      },
    ],
  };
}
