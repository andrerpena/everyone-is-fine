// =============================================================================
// JOB FACTORY - Creates concrete job instances
// =============================================================================

import { getConstructionCost } from "../../world/registries/construction-registry";
import { getFloorConstructionCost } from "../../world/registries/floor-registry";
import { STRUCTURE_REGISTRY } from "../../world/registries/structure-registry";
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
import { generateJobId, type Job, type JobStep } from "./types";

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
 * Create a "forage" job.
 * If yield is provided, spawns items at the bush location.
 * Otherwise falls back to restoring hunger directly (generic bush).
 * Bush is NOT destroyed (renewable resource).
 */
export function createForageJob(
  characterId: EntityId,
  target: Position3D,
  yield_?: { type: ItemType; quantity: number },
): Job {
  const completionStep: JobStep = yield_
    ? {
        type: "spawn_items",
        position: target,
        items: [{ type: yield_.type, quantity: yield_.quantity }],
        skillId: "plants",
        status: "pending",
      }
    : {
        type: "restore_need",
        needId: "hunger",
        amount: 0.3,
        status: "pending",
      };

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
      completionStep,
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
 * Create a "relax" job to restore recreation.
 * Steps: move to target → idle (work) 300 ticks → restore recreation
 */
export function createRelaxJob(characterId: EntityId, target: Position3D): Job {
  return {
    id: generateJobId(),
    type: "relax",
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
        totalTicks: 300,
        ticksWorked: 0,
        status: "pending",
      },
      {
        type: "restore_need",
        needId: "recreation",
        amount: 0.3,
        status: "pending",
      },
    ],
  };
}

/**
 * Create a "socialize" job to restore the social need.
 * Steps: move adjacent to another colonist → chat (work) 200 ticks → restore social
 */
export function createSocializeJob(
  characterId: EntityId,
  target: Position3D,
): Job {
  return {
    id: generateJobId(),
    type: "socialize",
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
        totalTicks: 200,
        ticksWorked: 0,
        status: "pending",
      },
      {
        type: "restore_need",
        needId: "social",
        amount: 0.35,
        status: "pending",
      },
    ],
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
        skillId: "cooking",
        status: "pending",
      },
    ],
  };
}

/**
 * Create a "dispense nutrient paste" job.
 * No raw food required — the dispenser produces paste from nothing.
 * Steps: move adjacent to dispenser → work 60 ticks → spawn nutrient_paste
 */
export function createDispenserJob(
  characterId: EntityId,
  dispenserPos: Position3D,
): Job {
  return {
    id: generateJobId(),
    type: "dispense",
    characterId,
    targetPosition: dispenserPos,
    currentStepIndex: 0,
    status: "pending",
    createdAt: Date.now(),
    steps: [
      {
        type: "move",
        destination: dispenserPos,
        adjacent: true,
        status: "pending",
      },
      {
        type: "work",
        totalTicks: 60,
        ticksWorked: 0,
        status: "pending",
      },
      {
        type: "spawn_items",
        position: dispenserPos,
        items: [{ type: "nutrient_paste", quantity: 1 }],
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

/** Base work ticks per health point of damage to repair */
const REPAIR_TICKS_PER_HP = 0.5;

/**
 * Create a "repair structure" job.
 * Restores a damaged structure to full health. No materials required.
 * Work time is proportional to the amount of damage.
 * Steps: move adjacent → work → repair_structure
 */
export function createRepairJob(
  characterId: EntityId,
  target: Position3D,
  structureType: StructureType,
  currentHealth: number,
): Job {
  const props = STRUCTURE_REGISTRY[structureType];
  const damage = props.maxHealth - currentHealth;
  const workTicks = Math.max(60, Math.round(damage * REPAIR_TICKS_PER_HP));

  return {
    id: generateJobId(),
    type: "repair",
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
        type: "repair_structure",
        position: target,
        status: "pending",
      },
    ],
  };
}

/** Terrain types that can be smoothed */
const SMOOTHABLE_TERRAIN: ReadonlySet<TerrainType> = new Set([
  "rock",
  "granite",
  "limestone",
  "marble",
  "obsidian",
]);

/** Base work ticks for smoothing (scaled by hardness) */
const SMOOTH_BASE_TICKS = 240;

/**
 * Check if a terrain type can be smoothed.
 */
export function isSmoothable(terrainType: TerrainType): boolean {
  return SMOOTHABLE_TERRAIN.has(terrainType);
}

/**
 * Create a "smooth stone" job.
 * Polishes rough rock terrain into a smooth stone floor.
 * No materials required — just work time that scales with hardness.
 * Steps: move adjacent → work → place stone_smooth floor
 */
export function createSmoothJob(
  characterId: EntityId,
  target: Position3D,
  terrainType: TerrainType,
): Job {
  const terrainProps = TERRAIN_REGISTRY[terrainType];
  const workTicks = Math.round(
    SMOOTH_BASE_TICKS * (0.5 + terrainProps.hardness),
  );

  return {
    id: generateJobId(),
    type: "smooth",
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
        type: "place_floor",
        position: target,
        floorType: "stone_smooth",
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

/** Base work ticks for cleaning a tile */
const CLEAN_BASE_TICKS = 120;

/**
 * Create a "clean tile" job.
 * Removes filth from a dirty tile. Work time scales with filth level.
 * Steps: move to tile → work → clean_tile
 */
export function createCleanJob(
  characterId: EntityId,
  target: Position3D,
  filthLevel: number,
): Job {
  const workTicks = Math.max(
    60,
    Math.round(CLEAN_BASE_TICKS * Math.min(filthLevel, 5)),
  );

  return {
    id: generateJobId(),
    type: "clean",
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
        type: "clean_tile",
        position: target,
        status: "pending",
      },
    ],
  };
}
