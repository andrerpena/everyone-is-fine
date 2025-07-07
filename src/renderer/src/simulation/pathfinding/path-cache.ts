// =============================================================================
// PATH CACHE WITH LRU EVICTION
// =============================================================================
// Caches computed paths to avoid redundant pathfinding calculations

import type { Position3D, ZLevel } from "../../world/types";
import { AStarPathfinder } from "./astar";
import type { Path, PathfinderOptions, PathResult } from "./types";
import { positionKey } from "./types";

// =============================================================================
// LRU CACHE IMPLEMENTATION
// =============================================================================

/**
 * LRU (Least Recently Used) Cache implementation.
 * Uses a Map which maintains insertion order in modern JS.
 */
class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    // Delete if exists (to refresh position)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

// =============================================================================
// PATH CACHE
// =============================================================================

/** Cache entry with path and metadata */
interface CacheEntry {
  path: Path;
  worldVersion: number;
}

/**
 * Path cache that stores computed paths for reuse.
 *
 * Features:
 * - LRU eviction when cache is full
 * - Automatic invalidation on world changes
 * - Version-based staleness detection
 *
 * Usage:
 * ```ts
 * const cache = new PathCache(level, 1000);
 * const path = cache.getPath(start, goal);
 * if (path) {
 *   // Use cached or newly computed path
 * }
 * ```
 */
export class PathCache {
  private cache: LRUCache<string, CacheEntry>;
  private level: ZLevel;
  private options: PathfinderOptions;
  private worldVersion: number = 0;

  /** Statistics for debugging */
  private stats = {
    hits: 0,
    misses: 0,
    invalidations: 0,
  };

  constructor(
    level: ZLevel,
    maxSize: number = 1000,
    options: PathfinderOptions = {},
  ) {
    this.cache = new LRUCache(maxSize);
    this.level = level;
    this.options = options;
  }

  /**
   * Get a path from start to goal, using cache if available.
   *
   * @param start - Starting position
   * @param goal - Goal position
   * @returns The path, or null if no path exists
   */
  getPath(start: Position3D, goal: Position3D): Path | null {
    const key = this.makeCacheKey(start, goal);

    // Check cache
    const cached = this.cache.get(key);
    if (cached && cached.worldVersion === this.worldVersion) {
      this.stats.hits++;
      return cached.path;
    }

    // Cache miss - compute new path
    this.stats.misses++;
    const pathfinder = new AStarPathfinder(this.level, this.options);
    const result = pathfinder.findPath(start, goal);

    if (result.found) {
      // Store in cache
      this.cache.set(key, {
        path: result.path,
        worldVersion: this.worldVersion,
      });
      return result.path;
    }

    return null;
  }

  /**
   * Get a path with full result metadata.
   */
  findPath(start: Position3D, goal: Position3D): PathResult {
    const key = this.makeCacheKey(start, goal);

    // Check cache
    const cached = this.cache.get(key);
    if (cached && cached.worldVersion === this.worldVersion) {
      this.stats.hits++;
      return {
        found: true,
        path: cached.path,
        nodesExplored: 0,
        timeMs: 0,
      };
    }

    // Cache miss - compute new path
    this.stats.misses++;
    const pathfinder = new AStarPathfinder(this.level, this.options);
    const result = pathfinder.findPath(start, goal);

    if (result.found) {
      // Store in cache
      this.cache.set(key, {
        path: result.path,
        worldVersion: this.worldVersion,
      });
    }

    return result;
  }

  /**
   * Invalidate all cached paths.
   * Call this when the world changes (tiles modified).
   */
  invalidate(): void {
    this.worldVersion++;
    this.stats.invalidations++;
  }

  /**
   * Invalidate paths that pass through a specific tile.
   * More efficient than full invalidation for single-tile changes.
   *
   * Note: This is a simple implementation that clears all paths.
   * A more sophisticated version could track which paths use which tiles.
   */
  invalidateTile(_position: Position3D): void {
    // For now, just invalidate all paths
    // A more complex implementation could track path-tile relationships
    this.invalidate();
  }

  /**
   * Update the z-level reference.
   * Call this when switching z-levels or when the level is regenerated.
   */
  setLevel(level: ZLevel): void {
    if (this.level !== level) {
      this.level = level;
      this.invalidate();
    }
  }

  /**
   * Clear all cached paths without incrementing version.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics.
   */
  getStats(): {
    hits: number;
    misses: number;
    invalidations: number;
    hitRate: number;
    size: number;
  } {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      size: this.cache.size,
    };
  }

  /**
   * Reset statistics.
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      invalidations: 0,
    };
  }

  /**
   * Create a cache key from start and goal positions.
   */
  private makeCacheKey(start: Position3D, goal: Position3D): string {
    return `${positionKey(start)}->${positionKey(goal)}`;
  }
}
