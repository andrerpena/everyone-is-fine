// =============================================================================
// HOME ZONE - Auto-computed area around player-built structures
// =============================================================================
// The home zone marks the "settled" area of the colony. It expands automatically
// as buildings are constructed and shrinks when they're deconstructed.

import { STRUCTURE_REGISTRY } from "../world/registries/structure-registry";
import type { World } from "../world/types";

/** Radius (Manhattan distance) around each structure included in the home zone */
export const HOME_ZONE_RADIUS = 3;

/**
 * Compute the set of tile keys ("x,y") that belong to the home zone.
 * Includes all tiles within `radius` Manhattan distance of any player-built structure.
 * Natural structures (trees, boulders, bushes) are excluded.
 */
export function computeHomeZoneTiles(
  world: World,
  radius: number = HOME_ZONE_RADIUS,
): Set<string> {
  const tiles = new Set<string>();
  const surfaceLevel = world.levels.get(world.surfaceZ);
  if (!surfaceLevel) return tiles;

  const { width, height } = surfaceLevel;

  // Find all tiles with player-built structures
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = surfaceLevel.tiles[y * width + x];
      if (!tile?.structure) continue;

      const props = STRUCTURE_REGISTRY[tile.structure.type];
      if (props.category === "natural") continue;
      if (tile.structure.type === "none") continue;

      // Add all tiles within Manhattan distance
      const minX = Math.max(0, x - radius);
      const maxX = Math.min(width - 1, x + radius);
      const minY = Math.max(0, y - radius);
      const maxY = Math.min(height - 1, y + radius);

      for (let ny = minY; ny <= maxY; ny++) {
        for (let nx = minX; nx <= maxX; nx++) {
          if (Math.abs(nx - x) + Math.abs(ny - y) <= radius) {
            tiles.add(`${nx},${ny}`);
          }
        }
      }
    }
  }

  return tiles;
}
