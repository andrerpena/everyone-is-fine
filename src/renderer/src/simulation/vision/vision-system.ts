// =============================================================================
// VISION SYSTEM
// =============================================================================
// Tick-based system that updates tile visibility flags based on colonist
// positions. Tiles within sight radius of any colonist are marked visible
// and explored. Explored tiles stay explored permanently.

import type { World } from "../../world/types";
import type { EntityStore } from "../entity-store";

/** How often (in ticks) the system recalculates visibility */
export const VISION_CHECK_INTERVAL = 30; // ~0.5s at 60 TPS

/** How far each colonist can see (in tiles) */
export const SIGHT_RADIUS = 12;

/** Pre-computed squared sight radius to avoid sqrt in distance checks */
const SIGHT_RADIUS_SQ = SIGHT_RADIUS * SIGHT_RADIUS;

/**
 * Updates tile visibility based on colonist positions.
 * Uses a simple circle-based vision model (no raycasting).
 */
export class VisionSystem {
  private ticksSinceLastCheck = 0;

  constructor(private entityStore: EntityStore) {}

  update(getWorld: () => World | null): void {
    this.ticksSinceLastCheck++;
    if (this.ticksSinceLastCheck < VISION_CHECK_INTERVAL) return;
    this.ticksSinceLastCheck = 0;

    const world = getWorld();
    if (!world) return;

    for (const level of world.levels.values()) {
      // Reset all tiles to not visible (explored stays true)
      for (const tile of level.tiles) {
        tile.visibility.visible = false;
      }

      // For each colonist on this level, mark tiles in sight radius
      for (const character of this.entityStore.values()) {
        if (character.position.z !== level.z) continue;

        const cx = character.position.x;
        const cy = character.position.y;

        const minX = Math.max(0, cx - SIGHT_RADIUS);
        const maxX = Math.min(level.width - 1, cx + SIGHT_RADIUS);
        const minY = Math.max(0, cy - SIGHT_RADIUS);
        const maxY = Math.min(level.height - 1, cy + SIGHT_RADIUS);

        for (let y = minY; y <= maxY; y++) {
          for (let x = minX; x <= maxX; x++) {
            const dx = x - cx;
            const dy = y - cy;
            if (dx * dx + dy * dy > SIGHT_RADIUS_SQ) continue;

            const tile = level.tiles[y * level.width + x];
            tile.visibility.visible = true;
            tile.visibility.explored = true;
          }
        }
      }
    }
  }
}
