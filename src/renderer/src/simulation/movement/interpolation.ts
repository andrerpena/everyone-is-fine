// =============================================================================
// INTERPOLATION UTILITIES
// =============================================================================
// Smooth visual interpolation for character movement

import type { Position2D, Position3D } from "../../world/types";
import type { Character } from "../types";

// =============================================================================
// INTERPOLATION FUNCTIONS
// =============================================================================

/**
 * Calculate the visual position of a character for rendering.
 * This combines the tile position with the visual offset for smooth movement.
 *
 * @param character - The character to get visual position for
 * @param cellSize - The size of each cell in pixels
 * @returns The pixel position for rendering
 */
export function getCharacterVisualPosition(
  character: Character,
  cellSize: number,
): Position2D {
  const baseX = character.position.x * cellSize;
  const baseY = character.position.y * cellSize;

  // Add visual offset (already in tile units, convert to pixels)
  const offsetX = character.visualOffset.x * cellSize;
  const offsetY = character.visualOffset.y * cellSize;

  return {
    x: baseX + offsetX,
    y: baseY + offsetY,
  };
}

/**
 * Calculate the center position of a character for rendering.
 *
 * @param character - The character
 * @param cellSize - The size of each cell in pixels
 * @returns The center pixel position
 */
export function getCharacterCenterPosition(
  character: Character,
  cellSize: number,
): Position2D {
  const pos = getCharacterVisualPosition(character, cellSize);
  return {
    x: pos.x + cellSize / 2,
    y: pos.y + cellSize / 2,
  };
}

/**
 * Linear interpolation between two values.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Linear interpolation between two 2D positions.
 */
export function lerpPosition2D(
  a: Position2D,
  b: Position2D,
  t: number,
): Position2D {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
  };
}

/**
 * Linear interpolation between two 3D positions.
 */
export function lerpPosition3D(
  a: Position3D,
  b: Position3D,
  t: number,
): Position3D {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t),
  };
}

// =============================================================================
// EASING FUNCTIONS
// =============================================================================

/**
 * Smooth step easing (smoothstep).
 * Starts slow, speeds up in the middle, slows down at the end.
 */
export function smoothStep(t: number): number {
  return t * t * (3 - 2 * t);
}

/**
 * Smoother step easing (Ken Perlin's improved smoothstep).
 */
export function smootherStep(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/**
 * Ease in (accelerating).
 */
export function easeIn(t: number, power: number = 2): number {
  return t ** power;
}

/**
 * Ease out (decelerating).
 */
export function easeOut(t: number, power: number = 2): number {
  return 1 - (1 - t) ** power;
}

/**
 * Ease in-out (accelerate then decelerate).
 */
export function easeInOut(t: number, power: number = 2): number {
  if (t < 0.5) {
    return 2 ** (power - 1) * t ** power;
  }
  return 1 - (-2 * t + 2) ** power / 2;
}

// =============================================================================
// DIRECTION UTILITIES
// =============================================================================

/**
 * Direction a character is facing (based on movement).
 */
export type Direction = "north" | "east" | "south" | "west" | "none";

/**
 * Get the direction a character is moving/facing.
 *
 * @param character - The character
 * @returns The direction they're facing
 */
export function getCharacterDirection(character: Character): Direction {
  const { path, pathIndex, isMoving } = character.movement;

  if (!isMoving || !path || pathIndex >= path.length - 1) {
    return "none";
  }

  const current = path[pathIndex];
  const next = path[pathIndex + 1];

  const dx = next.x - current.x;
  const dy = next.y - current.y;

  // Prioritize cardinal directions
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "east" : "west";
  }
  if (dy !== 0) {
    return dy > 0 ? "south" : "north";
  }

  return "none";
}

/**
 * Get the angle in radians for a direction.
 */
export function directionToAngle(direction: Direction): number {
  switch (direction) {
    case "north":
      return -Math.PI / 2;
    case "east":
      return 0;
    case "south":
      return Math.PI / 2;
    case "west":
      return Math.PI;
    default:
      return 0;
  }
}

/**
 * Get movement direction from two positions.
 */
export function getMovementDirection(
  from: Position2D,
  to: Position2D,
): Direction {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (dx === 0 && dy === 0) return "none";

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "east" : "west";
  }
  return dy > 0 ? "south" : "north";
}
