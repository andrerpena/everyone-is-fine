// =============================================================================
// MATERIAL COUNTER
// =============================================================================
// Utilities for counting available materials across the world map.

import type { ItemType, World } from "../types";

/** Result of a material sufficiency check */
export interface MaterialCheck {
  sufficient: boolean;
  missing: Array<{ type: ItemType; needed: number; available: number }>;
}

/**
 * Count the total quantity of a specific item type across all tiles in the world.
 */
export function countItemsOnMap(world: World, itemType: ItemType): number {
  let total = 0;
  for (const level of world.levels.values()) {
    for (const tile of level.tiles) {
      for (const item of tile.items) {
        if (item.type === itemType) {
          total += item.quantity;
        }
      }
    }
  }
  return total;
}

/**
 * Count all item types present on the map.
 * Returns a Map of item type → total quantity.
 */
export function countAllItemsOnMap(world: World): Map<ItemType, number> {
  const counts = new Map<ItemType, number>();
  for (const level of world.levels.values()) {
    for (const tile of level.tiles) {
      for (const item of tile.items) {
        counts.set(item.type, (counts.get(item.type) ?? 0) + item.quantity);
      }
    }
  }
  return counts;
}

/**
 * Count materials already reserved by pending blueprints on the map.
 * Each blueprint's construction cost is summed to determine total reserved materials.
 */
function countReservedMaterials(
  world: World,
  getCost: (
    type: string,
  ) => { materials: Array<{ type: ItemType; quantity: number }> } | null,
): Map<ItemType, number> {
  const reserved = new Map<ItemType, number>();
  for (const level of world.levels.values()) {
    for (const tile of level.tiles) {
      if (tile.blueprint) {
        const cost = getCost(tile.blueprint.type);
        if (cost) {
          for (const mat of cost.materials) {
            reserved.set(
              mat.type,
              (reserved.get(mat.type) ?? 0) + mat.quantity,
            );
          }
        }
      }
    }
  }
  return reserved;
}

/**
 * Check if sufficient materials exist on the map for a list of requirements.
 * Accounts for materials already reserved by existing blueprints.
 */
export function hasSufficientMaterials(
  world: World,
  materials: Array<{ type: ItemType; quantity: number }>,
  getCost: (
    type: string,
  ) => { materials: Array<{ type: ItemType; quantity: number }> } | null,
): MaterialCheck {
  const available = countAllItemsOnMap(world);
  const reserved = countReservedMaterials(world, getCost);
  const missing: MaterialCheck["missing"] = [];

  for (const { type, quantity } of materials) {
    const onMap = available.get(type) ?? 0;
    const alreadyReserved = reserved.get(type) ?? 0;
    const effectiveAvailable = Math.max(0, onMap - alreadyReserved);

    if (effectiveAvailable < quantity) {
      missing.push({ type, needed: quantity, available: effectiveAvailable });
    }
  }

  return { sufficient: missing.length === 0, missing };
}
