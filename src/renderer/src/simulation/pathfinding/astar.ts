// =============================================================================
// A* PATHFINDING ALGORITHM
// =============================================================================
// Implementation of A* pathfinding optimized for grid-based worlds

import type { Position3D, ZLevel } from "../../world/types";
import type { AStarNode, Path, PathfinderOptions, PathResult } from "./types";
import {
  ALL_DIRECTIONS,
  CARDINAL_DIRECTIONS,
  getMovementCost,
  octileDistance,
  positionKey,
  positionsEqual,
} from "./types";

// =============================================================================
// BINARY HEAP (MIN-HEAP) FOR PRIORITY QUEUE
// =============================================================================

/**
 * Binary min-heap for efficient priority queue operations.
 * Provides O(log n) insert and extract-min operations.
 */
class BinaryHeap<T> {
  private heap: T[] = [];
  private scoreFunction: (item: T) => number;

  constructor(scoreFunction: (item: T) => number) {
    this.scoreFunction = scoreFunction;
  }

  get size(): number {
    return this.heap.length;
  }

  push(item: T): void {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;

    const result = this.heap[0];
    const end = this.heap.pop();

    if (this.heap.length > 0 && end !== undefined) {
      this.heap[0] = end;
      this.sinkDown(0);
    }

    return result;
  }

  contains(item: T): boolean {
    return this.heap.includes(item);
  }

  update(item: T): void {
    const index = this.heap.indexOf(item);
    if (index !== -1) {
      this.bubbleUp(index);
      this.sinkDown(index);
    }
  }

  private bubbleUp(index: number): void {
    const item = this.heap[index];
    const score = this.scoreFunction(item);

    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      const parent = this.heap[parentIndex];

      if (score >= this.scoreFunction(parent)) break;

      this.heap[parentIndex] = item;
      this.heap[index] = parent;
      index = parentIndex;
    }
  }

  private sinkDown(index: number): void {
    const length = this.heap.length;
    const item = this.heap[index];
    const score = this.scoreFunction(item);

    while (true) {
      const leftChildIndex = 2 * index + 1;
      const rightChildIndex = 2 * index + 2;
      let swapIndex: number | null = null;
      let swapScore = score;

      if (leftChildIndex < length) {
        const leftScore = this.scoreFunction(this.heap[leftChildIndex]);
        if (leftScore < swapScore) {
          swapIndex = leftChildIndex;
          swapScore = leftScore;
        }
      }

      if (rightChildIndex < length) {
        const rightScore = this.scoreFunction(this.heap[rightChildIndex]);
        if (rightScore < swapScore) {
          swapIndex = rightChildIndex;
        }
      }

      if (swapIndex === null) break;

      this.heap[index] = this.heap[swapIndex];
      this.heap[swapIndex] = item;
      index = swapIndex;
    }
  }
}

// =============================================================================
// A* PATHFINDER CLASS
// =============================================================================

/**
 * A* pathfinder for grid-based worlds.
 *
 * Usage:
 * ```ts
 * const pathfinder = new AStarPathfinder(level);
 * const result = pathfinder.findPath(start, goal);
 * if (result.found) {
 *   console.log('Path:', result.path);
 * }
 * ```
 */
export class AStarPathfinder {
  private level: ZLevel;
  private options: Required<PathfinderOptions>;

  constructor(level: ZLevel, options: PathfinderOptions = {}) {
    this.level = level;
    this.options = {
      allowDiagonal: options.allowDiagonal ?? true,
      maxNodes: options.maxNodes ?? 10000,
      heuristicWeight: options.heuristicWeight ?? 1.0,
    };
  }

  /**
   * Find a path from start to goal position.
   *
   * @param start - Starting position
   * @param goal - Goal position
   * @returns PathResult with path and metadata
   */
  findPath(start: Position3D, goal: Position3D): PathResult {
    const startTime = performance.now();
    let nodesExplored = 0;

    // Early exit if start or goal is invalid
    if (!this.isValidPosition(start) || !this.isValidPosition(goal)) {
      return {
        found: false,
        path: [],
        nodesExplored: 0,
        timeMs: performance.now() - startTime,
      };
    }

    // Early exit if goal is not passable
    if (!this.isPassable(goal)) {
      return {
        found: false,
        path: [],
        nodesExplored: 0,
        timeMs: performance.now() - startTime,
      };
    }

    // Early exit if start equals goal
    if (positionsEqual(start, goal)) {
      return {
        found: true,
        path: [start],
        nodesExplored: 0,
        timeMs: performance.now() - startTime,
      };
    }

    // Node storage
    const nodeMap = new Map<string, AStarNode>();

    // Create start node
    const startNode: AStarNode = {
      position: start,
      g: 0,
      h: this.heuristic(start, goal),
      f: 0,
      parent: null,
      closed: false,
    };
    startNode.f = startNode.g + startNode.h;

    nodeMap.set(positionKey(start), startNode);

    // Open set (priority queue)
    const openSet = new BinaryHeap<AStarNode>((node) => node.f);
    openSet.push(startNode);

    // Directions to search
    const directions = this.options.allowDiagonal
      ? ALL_DIRECTIONS
      : CARDINAL_DIRECTIONS;

    // Main A* loop
    while (openSet.size > 0) {
      // Check max nodes limit
      if (nodesExplored >= this.options.maxNodes) {
        return {
          found: false,
          path: [],
          nodesExplored,
          timeMs: performance.now() - startTime,
        };
      }

      // Get node with lowest f score
      const current = openSet.pop();
      if (!current) break; // Should never happen given the while condition, but satisfies linter
      nodesExplored++;

      // Check if we reached the goal
      if (positionsEqual(current.position, goal)) {
        return {
          found: true,
          path: this.reconstructPath(current),
          nodesExplored,
          timeMs: performance.now() - startTime,
        };
      }

      // Mark as closed
      current.closed = true;

      // Explore neighbors
      for (const dir of directions) {
        const neighborPos: Position3D = {
          x: current.position.x + dir.x,
          y: current.position.y + dir.y,
          z: current.position.z, // Same z-level for now
        };

        // Skip invalid positions
        if (!this.isValidPosition(neighborPos)) continue;

        // Skip impassable tiles
        if (!this.isPassable(neighborPos)) continue;

        // Skip diagonal movement if blocked by adjacent walls
        if (dir.x !== 0 && dir.y !== 0 && this.options.allowDiagonal) {
          const adj1: Position3D = {
            x: current.position.x + dir.x,
            y: current.position.y,
            z: current.position.z,
          };
          const adj2: Position3D = {
            x: current.position.x,
            y: current.position.y + dir.y,
            z: current.position.z,
          };
          if (!this.isPassable(adj1) || !this.isPassable(adj2)) {
            continue;
          }
        }

        // Get or create neighbor node
        const neighborKey = positionKey(neighborPos);
        let neighbor = nodeMap.get(neighborKey);

        if (!neighbor) {
          neighbor = {
            position: neighborPos,
            g: Number.POSITIVE_INFINITY,
            h: this.heuristic(neighborPos, goal),
            f: Number.POSITIVE_INFINITY,
            parent: null,
            closed: false,
          };
          nodeMap.set(neighborKey, neighbor);
        }

        // Skip closed nodes
        if (neighbor.closed) continue;

        // Calculate tentative g score
        const movementCost = this.getMovementCostAt(neighborPos);
        const tentativeG =
          current.g +
          getMovementCost(current.position, neighborPos, movementCost);

        // Check if this is a better path
        if (tentativeG < neighbor.g) {
          neighbor.parent = current;
          neighbor.g = tentativeG;
          neighbor.f = neighbor.g + neighbor.h * this.options.heuristicWeight;

          if (!openSet.contains(neighbor)) {
            openSet.push(neighbor);
          } else {
            openSet.update(neighbor);
          }
        }
      }
    }

    // No path found
    return {
      found: false,
      path: [],
      nodesExplored,
      timeMs: performance.now() - startTime,
    };
  }

  /**
   * Reconstruct path from goal node back to start.
   */
  private reconstructPath(goalNode: AStarNode): Path {
    const path: Path = [];
    let current: AStarNode | null = goalNode;

    while (current !== null) {
      path.unshift(current.position);
      current = current.parent;
    }

    return path;
  }

  /**
   * Calculate heuristic (estimated cost to goal).
   */
  private heuristic(a: Position3D, b: Position3D): number {
    return octileDistance(a, b);
  }

  /**
   * Check if position is within level bounds.
   */
  private isValidPosition(pos: Position3D): boolean {
    return (
      pos.x >= 0 &&
      pos.x < this.level.width &&
      pos.y >= 0 &&
      pos.y < this.level.height &&
      pos.z === this.level.z
    );
  }

  /**
   * Check if tile at position is passable.
   */
  private isPassable(pos: Position3D): boolean {
    const index = pos.y * this.level.width + pos.x;
    const tile = this.level.tiles[index];
    return tile?.pathfinding?.isPassable ?? false;
  }

  /**
   * Get movement cost at position.
   */
  private getMovementCostAt(pos: Position3D): number {
    const index = pos.y * this.level.width + pos.x;
    const tile = this.level.tiles[index];
    return tile?.pathfinding?.movementCost ?? 1;
  }
}

// =============================================================================
// UTILITY FUNCTION
// =============================================================================

/**
 * Find a path using A* algorithm.
 *
 * @param level - The z-level to search
 * @param start - Starting position
 * @param goal - Goal position
 * @param options - Pathfinding options
 * @returns PathResult
 */
export function findPath(
  level: ZLevel,
  start: Position3D,
  goal: Position3D,
  options?: PathfinderOptions,
): PathResult {
  const pathfinder = new AStarPathfinder(level, options);
  return pathfinder.findPath(start, goal);
}
