// =============================================================================
// ITEM DETERIORATION SYSTEM
// =============================================================================
// Tick-based system that slowly degrades item condition on ground tiles.
// Items are removed when their condition reaches 0.

import type { World } from "../../world/types";

/** How often (in ticks) the system checks and degrades items */
const CHECK_INTERVAL = 300; // ~5 seconds at 60 TPS

/** Condition lost per check cycle */
const DETERIORATION_RATE = 0.002;

/**
 * Iterates all world tiles, reduces condition on ground items,
 * and removes items whose condition has reached zero.
 */
export class ItemDeteriorationSystem {
  private ticksSinceLastCheck = 0;

  update(getWorld: () => World | null): void {
    this.ticksSinceLastCheck++;
    if (this.ticksSinceLastCheck < CHECK_INTERVAL) return;
    this.ticksSinceLastCheck = 0;

    const world = getWorld();
    if (!world) return;

    for (const level of world.levels.values()) {
      for (const tile of level.tiles) {
        if (tile.items.length === 0) continue;

        for (let i = tile.items.length - 1; i >= 0; i--) {
          const item = tile.items[i];
          // Initialize condition if missing (legacy items)
          if (item.condition === undefined) {
            item.condition = 1;
          }
          item.condition = Math.max(0, item.condition - DETERIORATION_RATE);
          if (item.condition <= 0) {
            tile.items.splice(i, 1);
          }
        }
      }
    }
  }
}
