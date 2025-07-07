// =============================================================================
// PATHFINDING TYPES
// =============================================================================

import type { Position2D, Position3D } from "../../world/types";

// =============================================================================
// PATH TYPES
// =============================================================================

/** A computed path as a list of positions */
export type Path = Position3D[];

/** Result of a pathfinding operation */
export interface PathResult {
  /** Whether a path was found */
  found: boolean;
  /** The computed path (empty if not found) */
  path: Path;
  /** Number of nodes explored */
  nodesExplored: number;
  /** Time taken in milliseconds */
  timeMs: number;
}

// =============================================================================
// A* NODE TYPES
// =============================================================================

/** A node in the A* search graph */
export interface AStarNode {
  /** Position on the map */
  position: Position3D;
  /** Cost from start to this node */
  g: number;
  /** Heuristic cost from this node to goal */
  h: number;
  /** Total cost (g + h) */
  f: number;
  /** Parent node for path reconstruction */
  parent: AStarNode | null;
  /** Whether this node is in the closed set */
  closed: boolean;
}

// =============================================================================
// PATHFINDER OPTIONS
// =============================================================================

/** Options for pathfinding */
export interface PathfinderOptions {
  /** Whether to allow diagonal movement (default: true) */
  allowDiagonal?: boolean;
  /** Maximum number of nodes to explore (default: 10000) */
  maxNodes?: number;
  /** Heuristic weight for A* (default: 1.0) */
  heuristicWeight?: number;
}

// =============================================================================
// NEIGHBOR DIRECTIONS
// =============================================================================

/** Cardinal directions (N, E, S, W) */
export const CARDINAL_DIRECTIONS: Position2D[] = [
  { x: 0, y: -1 }, // North
  { x: 1, y: 0 }, // East
  { x: 0, y: 1 }, // South
  { x: -1, y: 0 }, // West
];

/** Diagonal directions (NE, SE, SW, NW) */
export const DIAGONAL_DIRECTIONS: Position2D[] = [
  { x: 1, y: -1 }, // NE
  { x: 1, y: 1 }, // SE
  { x: -1, y: 1 }, // SW
  { x: -1, y: -1 }, // NW
];

/** All 8 directions */
export const ALL_DIRECTIONS: Position2D[] = [
  ...CARDINAL_DIRECTIONS,
  ...DIAGONAL_DIRECTIONS,
];

// =============================================================================
// HEURISTIC FUNCTIONS
// =============================================================================

/** Manhattan distance (for 4-directional movement) */
export function manhattanDistance(a: Position3D, b: Position3D): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z);
}

/** Chebyshev distance (for 8-directional movement) */
export function chebyshevDistance(a: Position3D, b: Position3D): number {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  const dz = Math.abs(a.z - b.z);
  return Math.max(dx, dy, dz);
}

/** Euclidean distance */
export function euclideanDistance(a: Position3D, b: Position3D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/** Octile distance (better for grid with diagonals) */
export function octileDistance(a: Position3D, b: Position3D): number {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  const dz = Math.abs(a.z - b.z);
  const D = 1;
  const D2 = Math.SQRT2;
  // For 2D (ignoring z for now)
  return D * (dx + dy) + (D2 - 2 * D) * Math.min(dx, dy) + dz;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/** Convert Position3D to string key for maps */
export function positionKey(pos: Position3D): string {
  return `${pos.x},${pos.y},${pos.z}`;
}

/** Check if two positions are equal */
export function positionsEqual(a: Position3D, b: Position3D): boolean {
  return a.x === b.x && a.y === b.y && a.z === b.z;
}

/** Get movement cost for diagonal vs cardinal */
export function getMovementCost(
  from: Position3D,
  to: Position3D,
  baseCost: number,
): number {
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);

  // Diagonal movement costs more
  if (dx === 1 && dy === 1) {
    return baseCost * Math.SQRT2;
  }

  return baseCost;
}
