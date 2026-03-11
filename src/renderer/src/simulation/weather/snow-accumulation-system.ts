// =============================================================================
// SNOW ACCUMULATION SYSTEM
// =============================================================================
// Tick-based system that accumulates snow on tiles during snowy weather
// and melts it when the temperature rises above freezing.

import type { World } from "../../world/types";

// =============================================================================
// CONSTANTS
// =============================================================================

/** How often (in ticks) snow accumulation/melting is evaluated */
export const SNOW_CHECK_INTERVAL = 60; // ~1 second at 60 TPS

/** Snow depth added per check when snowing (0-1 scale) */
export const SNOW_ACCUMULATION_RATE = 0.005;

/** Snow depth removed per check when melting (temp > 0°C) */
export const SNOW_MELT_RATE = 0.003;

/** Maximum snow depth */
export const SNOW_MAX_DEPTH = 1.0;

/** Terrain types where snow cannot accumulate */
const NON_SNOW_TERRAINS = new Set([
  "water_shallow",
  "water_deep",
  "lava",
  "void",
]);

// =============================================================================
// SNOW ACCUMULATION SYSTEM CLASS
// =============================================================================

export class SnowAccumulationSystem {
  private ticksSinceLastCheck = 0;

  update(getWorld: () => World | null): void {
    this.ticksSinceLastCheck++;
    if (this.ticksSinceLastCheck < SNOW_CHECK_INTERVAL) return;
    this.ticksSinceLastCheck = 0;

    const world = getWorld();
    if (!world) return;

    const isSnowing = world.weather.type === "snow";
    const isMelting = world.weather.temperature > 0 && !isSnowing;

    // Skip if nothing to do
    if (!isSnowing && !isMelting) return;

    const rate = isSnowing
      ? SNOW_ACCUMULATION_RATE * world.weather.intensity
      : -SNOW_MELT_RATE;

    for (const level of world.levels.values()) {
      for (const tile of level.tiles) {
        // Skip terrain where snow can't accumulate
        if (NON_SNOW_TERRAINS.has(tile.terrain.type)) continue;

        if (isSnowing) {
          tile.snowDepth = Math.min(SNOW_MAX_DEPTH, tile.snowDepth + rate);
        } else {
          // Melting
          tile.snowDepth = Math.max(0, tile.snowDepth + rate);
        }
      }
    }
  }
}
