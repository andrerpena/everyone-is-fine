// =============================================================================
// FILTH SYSTEM
// =============================================================================
// Tick-based system that generates filth on tiles as colonists walk on them.
// Filth accumulates on constructed floors and indoor areas, reducing room beauty.

import type { World } from "../world/types";
import { getWorldTileAt } from "../world/utils/tile-utils";
import type { EntityStore } from "./entity-store";

// =============================================================================
// CONSTANTS
// =============================================================================

/** How often (in ticks) filth generation is evaluated */
export const FILTH_CHECK_INTERVAL = 30;

/** Probability of generating filth per colonist per check */
export const FILTH_CHANCE = 0.02;

/** Maximum filth level on a single tile */
export const FILTH_MAX = 5;

// =============================================================================
// FILTH SYSTEM CLASS
// =============================================================================

export class FilthSystem {
  private ticksSinceLastCheck = 0;

  constructor(private entityStore: EntityStore) {}

  update(getWorld: () => World | null): void {
    this.ticksSinceLastCheck++;
    if (this.ticksSinceLastCheck < FILTH_CHECK_INTERVAL) return;
    this.ticksSinceLastCheck = 0;

    const world = getWorld();
    if (!world) return;

    for (const character of this.entityStore.values()) {
      const tile = getWorldTileAt(
        world,
        character.position.x,
        character.position.y,
        character.position.z,
      );
      if (!tile) continue;

      // Only generate filth on tiles with constructed floors
      if (!tile.floor || tile.floor.type === "none") continue;

      // Skip if already at max filth
      if (tile.filth >= FILTH_MAX) continue;

      // Roll for filth
      if (Math.random() < FILTH_CHANCE) {
        tile.filth = Math.min(FILTH_MAX, tile.filth + 1);
      }
    }
  }
}
