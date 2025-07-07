// =============================================================================
// COLOR CONVERSION UTILITIES
// =============================================================================
// Pure functions for converting between color formats used in the app:
// - Hex strings "#RRGGBB" (canonical format in GameColors)
// - Pixi numbers 0xRRGGBB (used by Pixi.js renderers)
// - RGBA tuples [r, g, b, a] (used by Canvas 2D / minimap)

import type { ColorScale } from "../layers/types";
import type { ColorScaleHex } from "./theme";

/**
 * Convert a hex color string to a Pixi-compatible number.
 * @param hex - Color in "#RRGGBB" format
 * @returns Number in 0xRRGGBB format
 */
export function hexToPixi(hex: string): number {
  return Number.parseInt(hex.slice(1), 16);
}

/**
 * Convert a hex color string to an RGBA tuple.
 * @param hex - Color in "#RRGGBB" format
 * @param alpha - Alpha value 0-255 (default 255)
 * @returns [r, g, b, a] tuple
 */
export function hexToRGBA(
  hex: string,
  alpha = 255,
): [number, number, number, number] {
  const num = Number.parseInt(hex.slice(1), 16);
  return [(num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff, alpha];
}

/**
 * Convert a Pixi number to a hex color string.
 * @param pixi - Number in 0xRRGGBB format
 * @returns Color in "#rrggbb" format
 */
export function pixiToHex(pixi: number): string {
  return `#${pixi.toString(16).padStart(6, "0")}`;
}

/**
 * Convert a ColorScaleHex (hex strings) to a ColorScale (pixi numbers).
 */
export function resolveColorScale(scale: ColorScaleHex): ColorScale {
  return {
    type: scale.type,
    stops: scale.stops.map((s) => ({
      value: s.value,
      color: hexToPixi(s.color),
    })),
    midpoint: scale.midpoint,
  };
}

/**
 * Set a deeply nested value on an object using a dot-separated path.
 * Used for applying flat user config overrides to the nested GameColors object.
 * @param obj - Target object (mutated in place)
 * @param path - Dot-separated path (e.g., "world.background")
 * @param value - Value to set
 */
export function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
): void {
  const keys = path.split(".");
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (
      !(key in current) ||
      typeof current[key] !== "object" ||
      current[key] === null
    ) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]] = value;
}

/**
 * Split a flat theme overrides record into UI color overrides and game color overrides.
 * Keys starting with "ui." are UI overrides (prefix stripped); all others are game overrides.
 */
export function splitThemeOverrides(overrides: Record<string, string>): {
  uiOverrides: Record<string, string>;
  gameOverrides: Record<string, string>;
} {
  const uiOverrides: Record<string, string> = {};
  const gameOverrides: Record<string, string> = {};
  for (const [key, value] of Object.entries(overrides)) {
    if (key.startsWith("ui.")) {
      uiOverrides[key.slice(3)] = value;
    } else {
      gameOverrides[key] = value;
    }
  }
  return { uiOverrides, gameOverrides };
}
