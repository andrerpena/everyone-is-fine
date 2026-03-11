// =============================================================================
// JOB FACTORY - Creates concrete job instances
// =============================================================================

import { getConstructionCost } from "../../world/registries/construction-registry";
import { getFloorConstructionCost } from "../../world/registries/floor-registry";
import { TERRAIN_REGISTRY } from "../../world/registries/terrain-registry";
import type {
  CropType,
  FloorType,
  ItemType,
  Position3D,
  StructureType,
  TerrainType,
} from "../../world/types";
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

/** Stone yield per terrain type when mined */
const MINE_TERRAIN_YIELD: Partial<Record<TerrainType, ItemType>> = {
  rock: "stone",
  granite: "stone",
  limestone: "stone",
  marble: "stone",
  obsidian: "stone",
};

/** Base stone quantity from mining (scaled by hardness) */
const MINE_TERRAIN_BASE_QUANTITY = 15;

/** Base work ticks for mining terrain (scaled by hardness) */
const MINE_TERRAIN_BASE_TICKS = 360;

/**
 * Create a "mine terrain" job.
 * Digs into a rock terrain tile, converting it to gravel and yielding stone.
 * Work time scales with terrain hardness.
 * Steps: move adjacent → work → transform terrain to gravel → spawn stone
 */
export function createMineTerrainJob(
  characterId: EntityId,
  target: Position3D,
  terrainType: TerrainType,
): Job {
  const terrainProps = TERRAIN_REGISTRY[terrainType];
  const workTicks = Math.round(
    MINE_TERRAIN_BASE_TICKS * (0.5 + terrainProps.hardness),
  );
  const itemType = MINE_TERRAIN_YIELD[terrainType] ?? "stone";
  const quantity = Math.round(
    MINE_TERRAIN_BASE_QUANTITY * (0.5 + terrainProps.hardness),
  );

  return {
    id: generateJobId(),
    type: "mine_terrain",
    characterId,
    targetPosition: target,
    currentStepIndex: 0,
    status: "pending",
    createdAt: Date.now(),
    steps: [
      { type: "move", destination: target, adjacent: true, status: "pending" },
      {
        type: "work",
        totalTicks: workTicks,
        ticksWorked: 0,
        status: "pending",
      },
      {
        type: "transform_tile",
        position: target,
        newTerrain: "gravel",
        status: "pending",
      },
      {
        type: "spawn_items",
        position: target,
        items: [{ type: itemType, quantity }],
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
 * Create a sleep job.
 * If onBed is true, colonist moves to the bed and gets bonus comfort.
 * Steps: [move to bed?] → work 600 ticks → restore energy → restore comfort
 */
export function createSleepJob(
  characterId: EntityId,
  target: Position3D,
  onBed = false,
): Job {
  const steps: Job["steps"] = [];

  // If sleeping on a bed, move to the bed tile first
  if (onBed) {
    steps.push({
      type: "move",
      destination: target,
      adjacent: false,
      status: "pending",
    });
  }

  steps.push(
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
    {
      type: "restore_need",
      needId: "comfort",
      amount: onBed ? 0.4 : 0.15,
      status: "pending",
    },
  );

  return {
    id: generateJobId(),
    type: "sleep",
    characterId,
    targetPosition: target,
    currentStepIndex: 0,
    status: "pending",
    createdAt: Date.now(),
    steps,
  };
}

/**
 * Create a "cook meal" job.
 * The CookingSystem removes raw food before assigning this job.
 * Steps: move adjacent to campfire → work 180 ticks → spawn meal_simple
 */
export function createCookJob(
  characterId: EntityId,
  campfirePos: Position3D,
): Job {
  return {
    id: generateJobId(),
    type: "cook",
    characterId,
    targetPosition: campfirePos,
    currentStepIndex: 0,
    status: "pending",
    createdAt: Date.now(),
    steps: [
      {
        type: "move",
        destination: campfirePos,
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
        type: "spawn_items",
        position: campfirePos,
        items: [{ type: "meal_simple", quantity: 1 }],
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

/** Material recovery rate for deconstruction (75%) */
const DECONSTRUCT_RECOVERY_RATE = 0.75;

/** Deconstruction takes half the time of construction */
const DECONSTRUCT_TIME_MULTIPLIER = 0.5;

/**
 * Create a "deconstruct structure" job.
 * Steps: move adjacent → work (50% of build time) → spawn recovered materials → remove structure
 */
export function createDeconstructJob(
  characterId: EntityId,
  target: Position3D,
  structureType: StructureType,
): Job {
  const cost = getConstructionCost(structureType);
  const workTicks = Math.max(
    60,
    Math.floor((cost?.workTicks ?? 300) * DECONSTRUCT_TIME_MULTIPLIER),
  );

  // Recover 75% of original materials
  const recoveredItems: Array<{ type: ItemType; quantity: number }> = [];
  if (cost) {
    for (const mat of cost.materials) {
      const qty = Math.floor(mat.quantity * DECONSTRUCT_RECOVERY_RATE);
      if (qty > 0) {
        recoveredItems.push({ type: mat.type, quantity: qty });
      }
    }
  }

  return {
    id: generateJobId(),
    type: "deconstruct",
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
        type: "transform_tile",
        position: target,
        removeStructure: true,
        status: "pending",
      },
      ...(recoveredItems.length > 0
        ? [
            {
              type: "spawn_items" as const,
              position: target,
              items: recoveredItems,
              status: "pending" as const,
            },
          ]
        : []),
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

/**
 * Create a "build floor" job.
 * Steps: move to tile → work (based on floor type) → place floor
 */
export function createBuildFloorJob(
  characterId: EntityId,
  target: Position3D,
  floorType: FloorType,
): Job {
  const cost = getFloorConstructionCost(floorType);
  const workTicks = cost?.workTicks ?? 120;

  return {
    id: generateJobId(),
    type: "build_floor",
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
        totalTicks: workTicks,
        ticksWorked: 0,
        status: "pending",
      },
      {
        type: "place_floor",
        position: target,
        floorType,
        status: "pending",
      },
    ],
  };
}
