// =============================================================================
// PLANT GROWTH SYSTEM
// =============================================================================
// Tick-based system that advances crop growth on tiles based on temperature
// suitability and terrain moisture. Runs every GROWTH_CHECK_INTERVAL ticks.

import { TERRAIN_REGISTRY } from "../../world/registries/terrain-registry";
import type { GrowthStage, World } from "../../world/types";
import { CROP_REGISTRY } from "./crop-registry";

// =============================================================================
// CONSTANTS
// =============================================================================

/** How often (in ticks) growth is evaluated */
export const GROWTH_CHECK_INTERVAL = 60;

/** Growth stage thresholds (progress value) */
export const STAGE_SEEDLING_MAX = 0.25;
export const STAGE_GROWING_MAX = 0.75;

// =============================================================================
// HELPERS
// =============================================================================

/** Determine the growth stage from a progress value (0-1) */
export function getStageForProgress(progress: number): GrowthStage {
  if (progress < STAGE_SEEDLING_MAX) return "seedling";
  if (progress < STAGE_GROWING_MAX) return "growing";
  return "mature";
}

/** Returns a 0-1 temperature suitability factor. 0 if outside viable range. */
function getTemperatureFactor(
  temp: number,
  minTemp: number,
  maxTemp: number,
): number {
  if (temp < minTemp || temp > maxTemp) return 0;
  // Optimal range is the middle 60% of the viable range
  const range = maxTemp - minTemp;
  const optLow = minTemp + range * 0.2;
  const optHigh = maxTemp - range * 0.2;
  if (temp >= optLow && temp <= optHigh) return 1;
  if (temp < optLow) return (temp - minTemp) / (optLow - minTemp);
  return (maxTemp - temp) / (maxTemp - optHigh);
}

// =============================================================================
// SYSTEM CLASS
// =============================================================================

export class PlantGrowthSystem {
  private ticksSinceLastCheck = 0;

  update(getWorld: () => World | null): void {
    this.ticksSinceLastCheck++;
    if (this.ticksSinceLastCheck < GROWTH_CHECK_INTERVAL) return;
    this.ticksSinceLastCheck = 0;

    const world = getWorld();
    if (!world) return;

    const temperature = world.weather.temperature;

    for (const level of world.levels.values()) {
      for (const tile of level.tiles) {
        const crop = tile.crop;
        if (!crop) continue;
        if (crop.stage === "wilted") continue;

        const props = CROP_REGISTRY[crop.type];
        const tempFactor = getTemperatureFactor(
          temperature,
          props.minTemp,
          props.maxTemp,
        );

        // Wilt if temperature is completely outside viable range
        if (tempFactor === 0) {
          tile.crop = { ...crop, stage: "wilted" };
          continue;
        }

        // Terrain moisture boosts growth (0-1 scale, baseline 0.5)
        const terrainProps = TERRAIN_REGISTRY[tile.terrain.type];
        const moistureFactor =
          0.5 + tile.terrain.moisture * 0.5 * terrainProps.fertility;

        // Advance growth
        const progressPerCheck =
          (GROWTH_CHECK_INTERVAL / props.growthTicks) *
          tempFactor *
          moistureFactor;
        const newProgress = Math.min(1, crop.growthProgress + progressPerCheck);
        const newStage =
          crop.stage === "mature" ? "mature" : getStageForProgress(newProgress);

        tile.crop = {
          ...crop,
          growthProgress: newProgress,
          stage: newStage,
        };
      }
    }
  }
}
