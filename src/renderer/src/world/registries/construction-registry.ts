// =============================================================================
// CONSTRUCTION REGISTRY
// =============================================================================
// Defines what it costs to build each structure: required materials and work time.

import type { ItemType, StructureType } from "../types";

/** Cost definition for building a structure */
export interface ConstructionCost {
  /** Materials required to build */
  materials: Array<{ type: ItemType; quantity: number }>;
  /** Total work ticks needed to complete construction */
  workTicks: number;
}

/**
 * Construction costs for buildable structures.
 * Natural structures (trees, bushes, boulders) and "none" are not buildable.
 */
export const CONSTRUCTION_REGISTRY: Partial<
  Record<StructureType, ConstructionCost>
> = {
  // Walls
  wall_wood: {
    materials: [{ type: "wood", quantity: 5 }],
    workTicks: 300, // ~5s at 60 TPS
  },
  wall_stone: {
    materials: [{ type: "stone", quantity: 5 }],
    workTicks: 450,
  },
  wall_metal: {
    materials: [{ type: "iron", quantity: 5 }],
    workTicks: 600,
  },
  wall_brick: {
    materials: [{ type: "stone", quantity: 4 }],
    workTicks: 400,
  },

  // Doors
  door_wood: {
    materials: [{ type: "wood", quantity: 3 }],
    workTicks: 200,
  },
  door_metal: {
    materials: [{ type: "iron", quantity: 3 }],
    workTicks: 400,
  },
  door_auto: {
    materials: [{ type: "iron", quantity: 5 }],
    workTicks: 600,
  },

  // Furniture
  bed: {
    materials: [
      { type: "wood", quantity: 3 },
      { type: "cloth", quantity: 2 },
    ],
    workTicks: 250,
  },
  chair: {
    materials: [{ type: "wood", quantity: 2 }],
    workTicks: 120,
  },
  table: {
    materials: [{ type: "wood", quantity: 3 }],
    workTicks: 180,
  },

  // Machines
  workbench: {
    materials: [
      { type: "wood", quantity: 5 },
      { type: "iron", quantity: 2 },
    ],
    workTicks: 400,
  },
  campfire: {
    materials: [
      { type: "wood", quantity: 5 },
      { type: "stone", quantity: 3 },
    ],
    workTicks: 120,
  },
  nutrient_paste_dispenser: {
    materials: [
      { type: "iron", quantity: 5 },
      { type: "stone", quantity: 3 },
    ],
    workTicks: 600,
  },

  // Containers
  chest: {
    materials: [{ type: "wood", quantity: 4 }],
    workTicks: 200,
  },
  shelf: {
    materials: [{ type: "wood", quantity: 3 }],
    workTicks: 150,
  },
};

/** Check if a structure type is buildable */
export function isBuildable(type: StructureType): boolean {
  return type in CONSTRUCTION_REGISTRY;
}

/** Get construction cost for a structure type, or null if not buildable */
export function getConstructionCost(
  type: StructureType,
): ConstructionCost | null {
  return CONSTRUCTION_REGISTRY[type] ?? null;
}
