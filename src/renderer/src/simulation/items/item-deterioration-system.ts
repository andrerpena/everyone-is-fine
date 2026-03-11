// =============================================================================
// ITEM DETERIORATION SYSTEM
// =============================================================================
// Tick-based system that slowly degrades item condition on ground tiles.
// Food items spoil at their own rate, scaled by temperature.
// Items are removed when their condition reaches 0.

import { ITEM_REGISTRY } from "../../world/registries/item-registry";
import type { World } from "../../world/types";

/** How often (in ticks) the system checks and degrades items */
export const CHECK_INTERVAL = 300; // ~5 seconds at 60 TPS

/** Base condition lost per check cycle for non-perishable items */
export const BASE_DETERIORATION_RATE = 0.002;

/** Temperature above which food spoils faster */
export const SPOILAGE_HEAT_THRESHOLD = 25;

/** Temperature below which food spoils slower */
export const SPOILAGE_COLD_THRESHOLD = 5;

/** Multiplier applied to spoilage rate when temperature is above heat threshold */
export const SPOILAGE_HEAT_MULTIPLIER = 2.0;

/** Multiplier applied to spoilage rate when temperature is below cold threshold */
export const SPOILAGE_COLD_MULTIPLIER = 0.5;

/**
 * Compute the temperature-adjusted spoilage rate for a food item.
 */
export function getSpoilageRate(
  baseSpoilage: number,
  temperature: number,
): number {
  if (baseSpoilage <= 0) return 0;
  if (temperature > SPOILAGE_HEAT_THRESHOLD)
    return baseSpoilage * SPOILAGE_HEAT_MULTIPLIER;
  if (temperature < SPOILAGE_COLD_THRESHOLD)
    return baseSpoilage * SPOILAGE_COLD_MULTIPLIER;
  return baseSpoilage;
}

/**
 * Iterates all world tiles, reduces condition on ground items,
 * and removes items whose condition has reached zero.
 * Food items use per-type spoilage rates scaled by temperature.
 */
export class ItemDeteriorationSystem {
  private ticksSinceLastCheck = 0;

  update(getWorld: () => World | null): void {
    this.ticksSinceLastCheck++;
    if (this.ticksSinceLastCheck < CHECK_INTERVAL) return;
    this.ticksSinceLastCheck = 0;

    const world = getWorld();
    if (!world) return;

    const temperature = world.weather.temperature;

    for (const level of world.levels.values()) {
      for (const tile of level.tiles) {
        if (tile.items.length === 0) continue;

        for (let i = tile.items.length - 1; i >= 0; i--) {
          const item = tile.items[i];
          // Initialize condition if missing (legacy items)
          if (item.condition === undefined) {
            item.condition = 1;
          }

          const props = ITEM_REGISTRY[item.type];
          const spoilage = props.spoilageRate;

          // Use spoilage rate (temperature-adjusted) for perishables,
          // base deterioration for everything else
          const rate =
            spoilage > 0
              ? getSpoilageRate(spoilage, temperature)
              : BASE_DETERIORATION_RATE;

          item.condition = Math.max(0, item.condition - rate);
          if (item.condition <= 0) {
            tile.items.splice(i, 1);
          }
        }
      }
    }
  }
}
