// =============================================================================
// WORLD STATE HOOKS
// =============================================================================

import { useMemo } from "react";
import type { Position2D, Tile, World, ZLevel } from "../../world/types";
import { getTileAt } from "../../world/utils/tile-utils";
import { useGameStore } from "../store";

/**
 * Get the current world
 */
export function useWorld(): World | null {
  return useGameStore((state) => state.world);
}

/**
 * Check if world is initialized
 */
export function useIsWorldInitialized(): boolean {
  return useGameStore((state) => state.world !== null);
}

/**
 * Get the current z-level number
 */
export function useCurrentZLevel(): number {
  return useGameStore((state) => state.currentZLevel);
}

/**
 * Get the current z-level data
 */
export function useCurrentLevel(): ZLevel | null {
  const world = useGameStore((state) => state.world);
  const currentZLevel = useGameStore((state) => state.currentZLevel);

  return useMemo(() => {
    if (!world) return null;
    return world.levels.get(currentZLevel) ?? null;
  }, [world, currentZLevel]);
}

/**
 * Get a specific z-level by number
 */
export function useLevel(zLevel: number): ZLevel | null {
  const world = useGameStore((state) => state.world);

  return useMemo(() => {
    if (!world) return null;
    return world.levels.get(zLevel) ?? null;
  }, [world, zLevel]);
}

/**
 * Get a tile at a specific position on the current level
 */
export function useTileAt(position: Position2D | null): Tile | null {
  const level = useCurrentLevel();

  return useMemo(() => {
    if (!level || !position) return null;
    return getTileAt(level, position.x, position.y) ?? null;
  }, [level, position]);
}

/**
 * Get world actions
 */
export function useWorldActions() {
  const setWorld = useGameStore((state) => state.setWorld);
  const setCurrentZLevel = useGameStore((state) => state.setCurrentZLevel);
  const updateTile = useGameStore((state) => state.updateTile);

  return { setWorld, setCurrentZLevel, updateTile };
}

/**
 * Get world dimensions
 */
export function useWorldDimensions() {
  const world = useGameStore((state) => state.world);

  return useMemo(() => {
    if (!world) {
      return {
        width: 0,
        height: 0,
        minZ: 0,
        maxZ: 0,
      };
    }
    return world.dimensions;
  }, [world]);
}

/**
 * Get world metadata
 */
export function useWorldMetadata() {
  const world = useGameStore((state) => state.world);
  return world?.metadata ?? null;
}

/**
 * Get world generation config
 */
export function useWorldConfig() {
  return useGameStore((state) => state.worldConfig);
}
