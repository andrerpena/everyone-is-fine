// =============================================================================
// AMBIENT LIGHTING SYSTEM
// =============================================================================
// Provides day/night visual cycle by computing overlay color and alpha
// based on the in-game hour. Uses smooth per-hour interpolation.

import type { Graphics } from "pixi.js";

// =============================================================================
// TYPES
// =============================================================================

/** Lighting parameters for the ambient overlay */
export interface AmbientLighting {
  /** Overlay color (hex) */
  color: number;
  /** Overlay alpha (0 = clear, 1 = fully tinted) */
  alpha: number;
}

// =============================================================================
// LIGHTING TABLE
// =============================================================================

/**
 * Per-hour lighting definitions (index = hour 0-23).
 * Colors smoothly interpolated between hours.
 *
 * Design:
 * - Night (22-4): deep blue, high alpha
 * - Dawn (5-6): warm transition, decreasing alpha
 * - Day (7-16): no overlay
 * - Evening (17-19): warm golden, gentle alpha
 * - Dusk (20-21): cooling blue, increasing alpha
 */
const HOUR_LIGHTING: readonly AmbientLighting[] = [
  // 0-4: Deep night
  { color: 0x0a1128, alpha: 0.5 },
  { color: 0x0a1128, alpha: 0.5 },
  { color: 0x0a1128, alpha: 0.5 },
  { color: 0x0a1128, alpha: 0.48 },
  { color: 0x0e1a3a, alpha: 0.45 },
  // 5-6: Dawn
  { color: 0x2a1a3a, alpha: 0.3 },
  { color: 0x4a2a20, alpha: 0.15 },
  // 7-16: Day (no overlay)
  { color: 0x000000, alpha: 0.0 },
  { color: 0x000000, alpha: 0.0 },
  { color: 0x000000, alpha: 0.0 },
  { color: 0x000000, alpha: 0.0 },
  { color: 0x000000, alpha: 0.0 },
  { color: 0x000000, alpha: 0.0 },
  { color: 0x000000, alpha: 0.0 },
  { color: 0x000000, alpha: 0.0 },
  { color: 0x000000, alpha: 0.0 },
  { color: 0x000000, alpha: 0.0 },
  // 17-19: Evening
  { color: 0x3a2a10, alpha: 0.05 },
  { color: 0x3a2010, alpha: 0.12 },
  { color: 0x2a1a18, alpha: 0.2 },
  // 20-21: Dusk
  { color: 0x1a1530, alpha: 0.3 },
  { color: 0x101030, alpha: 0.4 },
  // 22-23: Night begins
  { color: 0x0a1128, alpha: 0.48 },
  { color: 0x0a1128, alpha: 0.5 },
];

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Get the ambient lighting for a given hour (0-23).
 * Returns the exact lighting for that hour (no interpolation between hours).
 */
export function getAmbientLighting(hour: number): AmbientLighting {
  const clamped = Math.max(0, Math.min(23, Math.floor(hour)));
  return HOUR_LIGHTING[clamped];
}

/** Eclipse overlay: dark blue tint at high alpha */
const ECLIPSE_LIGHTING: AmbientLighting = {
  color: 0x0a0a28,
  alpha: 0.4,
};

/**
 * Update an ambient overlay Graphics object for the given hour.
 * Redraws the full-world rectangle with the appropriate color and alpha.
 * When eclipseActive is true, applies a dark overlay regardless of time.
 * Returns true if the overlay is visible (alpha > 0), false otherwise.
 */
export function updateAmbientOverlay(
  graphics: Graphics,
  worldWidth: number,
  worldHeight: number,
  hour: number,
  eclipseActive = false,
): boolean {
  const baseLighting = getAmbientLighting(hour);
  const lighting = eclipseActive
    ? {
        color: ECLIPSE_LIGHTING.color,
        alpha: Math.max(baseLighting.alpha, ECLIPSE_LIGHTING.alpha),
      }
    : baseLighting;

  graphics.clear();

  if (lighting.alpha <= 0) {
    graphics.visible = false;
    return false;
  }

  graphics.visible = true;
  graphics.rect(0, 0, worldWidth, worldHeight);
  graphics.fill({ color: lighting.color, alpha: lighting.alpha });
  return true;
}
