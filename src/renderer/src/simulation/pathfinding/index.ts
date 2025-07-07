// =============================================================================
// PATHFINDING MODULE EXPORTS
// =============================================================================

export { AStarPathfinder, findPath } from "./astar";
export { PathCache } from "./path-cache";
export {
  // Direction constants
  ALL_DIRECTIONS,
  // Types
  type AStarNode,
  CARDINAL_DIRECTIONS,
  // Heuristic functions
  chebyshevDistance,
  DIAGONAL_DIRECTIONS,
  euclideanDistance,
  // Utility functions
  getMovementCost,
  manhattanDistance,
  octileDistance,
  type Path,
  type PathfinderOptions,
  type PathResult,
  positionKey,
  positionsEqual,
} from "./types";
