import { useGameColorStore } from "../theming/game-color-store";
import type { ColorScale } from "./types";

// =============================================================================
// COLOR UTILITIES
// =============================================================================

/**
 * Interpolate between two colors.
 * @param color1 First color (hex number)
 * @param color2 Second color (hex number)
 * @param t Interpolation factor (0-1)
 * @returns Interpolated color (hex number)
 */
export function lerpColor(color1: number, color2: number, t: number): number {
  const r1 = (color1 >> 16) & 0xff;
  const g1 = (color1 >> 8) & 0xff;
  const b1 = color1 & 0xff;

  const r2 = (color2 >> 16) & 0xff;
  const g2 = (color2 >> 8) & 0xff;
  const b2 = color2 & 0xff;

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return (r << 16) | (g << 8) | b;
}

/**
 * Get a color from a color scale at a given value.
 * @param scale The color scale configuration
 * @param value The value (0-1)
 * @returns The interpolated color (hex number)
 */
export function getColorFromScale(scale: ColorScale, value: number): number {
  // Clamp value to 0-1
  const clampedValue = Math.max(0, Math.min(1, value));

  // Sort stops by value
  const sortedStops = [...scale.stops].sort((a, b) => a.value - b.value);

  // Handle edge cases
  if (sortedStops.length === 0) return 0x808080; // Gray fallback
  if (sortedStops.length === 1) return sortedStops[0].color;
  if (clampedValue <= sortedStops[0].value) return sortedStops[0].color;
  if (clampedValue >= sortedStops[sortedStops.length - 1].value) {
    return sortedStops[sortedStops.length - 1].color;
  }

  // Find the two stops to interpolate between
  for (let i = 0; i < sortedStops.length - 1; i++) {
    const stop1 = sortedStops[i];
    const stop2 = sortedStops[i + 1];

    if (clampedValue >= stop1.value && clampedValue <= stop2.value) {
      const t = (clampedValue - stop1.value) / (stop2.value - stop1.value);
      return lerpColor(stop1.color, stop2.color, t);
    }
  }

  return sortedStops[sortedStops.length - 1].color;
}

/**
 * Normalize a value to 0-1 range given a min/max range.
 */
export function normalizeValue(
  value: number,
  min: number,
  max: number,
): number {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

// =============================================================================
// RESOLVED COLOR SCALES (from game color store)
// =============================================================================

export type HeatmapScaleId = "temperature" | "moisture" | "movementCost";

/**
 * Get the latest resolved color scale from the game color store.
 * Call at render time for live theme-responsive scales.
 */
export function getResolvedScale(id: HeatmapScaleId): ColorScale {
  return useGameColorStore.getState().resolved.heatmaps[id];
}
