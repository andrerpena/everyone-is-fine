// =============================================================================
// FLOOR REGISTRY
// =============================================================================
// Defines floor properties and construction costs for buildable floor types.

import type { FloorType, ItemType } from "../types";

/** Properties for a floor type */
export interface FloorProperties {
  type: FloorType;
  /** Movement cost multiplier (< 1 = faster, > 1 = slower) */
  movementCost: number;
  /** Aesthetic value per tile */
  beauty: number;
  /** Economic value per tile */
  baseValue: number;
}

/** Cost to build a floor */
export interface FloorConstructionCost {
  materials: Array<{ type: ItemType; quantity: number }>;
  workTicks: number;
}

export const FLOOR_REGISTRY: Record<FloorType, FloorProperties> = {
  none: { type: "none", movementCost: 1, beauty: 0, baseValue: 0 },
  dirt_path: { type: "dirt_path", movementCost: 0.9, beauty: 0, baseValue: 0 },
  wood_plank: {
    type: "wood_plank",
    movementCost: 0.8,
    beauty: 1,
    baseValue: 5,
  },
  stone_tile: {
    type: "stone_tile",
    movementCost: 0.75,
    beauty: 1,
    baseValue: 8,
  },
  stone_flagstone: {
    type: "stone_flagstone",
    movementCost: 0.75,
    beauty: 2,
    baseValue: 12,
  },
  marble_tile: {
    type: "marble_tile",
    movementCost: 0.7,
    beauty: 3,
    baseValue: 25,
  },
  metal_grate: {
    type: "metal_grate",
    movementCost: 0.8,
    beauty: 0,
    baseValue: 15,
  },
  carpet: { type: "carpet", movementCost: 0.85, beauty: 2, baseValue: 10 },
  concrete: { type: "concrete", movementCost: 0.75, beauty: 0, baseValue: 5 },
  stone_smooth: {
    type: "stone_smooth",
    movementCost: 0.7,
    beauty: 2,
    baseValue: 10,
  },
};

/**
 * Construction costs for buildable floors.
 * "none" and "dirt_path" are not buildable (natural/free).
 */
export const FLOOR_CONSTRUCTION_REGISTRY: Partial<
  Record<FloorType, FloorConstructionCost>
> = {
  wood_plank: {
    materials: [{ type: "wood", quantity: 2 }],
    workTicks: 120,
  },
  stone_tile: {
    materials: [{ type: "stone", quantity: 2 }],
    workTicks: 150,
  },
  stone_flagstone: {
    materials: [{ type: "stone", quantity: 3 }],
    workTicks: 200,
  },
  marble_tile: {
    materials: [{ type: "stone", quantity: 3 }],
    workTicks: 250,
  },
  metal_grate: {
    materials: [{ type: "iron", quantity: 2 }],
    workTicks: 200,
  },
  carpet: {
    materials: [{ type: "cloth", quantity: 2 }],
    workTicks: 100,
  },
  concrete: {
    materials: [{ type: "stone", quantity: 2 }],
    workTicks: 150,
  },
};

/** Check if a floor type is buildable */
export function isFloorBuildable(type: FloorType): boolean {
  return type in FLOOR_CONSTRUCTION_REGISTRY;
}

/** Get construction cost for a floor type, or null if not buildable */
export function getFloorConstructionCost(
  type: FloorType,
): FloorConstructionCost | null {
  return FLOOR_CONSTRUCTION_REGISTRY[type] ?? null;
}

/** Get properties for a floor type */
export function getFloorProperties(type: FloorType): FloorProperties {
  return FLOOR_REGISTRY[type];
}
