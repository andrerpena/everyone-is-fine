// =============================================================================
// SELECTION HOOKS
// =============================================================================

import { useMemo } from "react";
import type { Tile } from "../../world/types";
import { getTileAt } from "../../world/utils/tile-utils";
import { useGameStore } from "../store";
import type {
  EntitySelection,
  SelectedTileInfo,
  Selection,
  TileSelection,
} from "../types";

/**
 * Get the current selection state
 */
export function useSelection(): Selection {
  return useGameStore((state) => state.selection);
}

/**
 * Check if anything is selected
 */
export function useHasSelection(): boolean {
  return useGameStore((state) => state.selection.type !== "none");
}

/**
 * Get the current selection type
 */
export function useSelectionType(): Selection["type"] {
  return useGameStore((state) => state.selection.type);
}

/**
 * Get tile selection info (position, zLevel, and tile data)
 * Returns null if selection is not a tile
 */
export function useSelectedTile(): SelectedTileInfo | null {
  const selection = useGameStore((state) => state.selection);
  const world = useGameStore((state) => state.world);

  return useMemo(() => {
    if (selection.type !== "tile" || !world) {
      return null;
    }

    const tileSelection = selection as TileSelection;
    const level = world.levels.get(tileSelection.zLevel);
    if (!level) return null;

    const tile = getTileAt(
      level,
      tileSelection.position.x,
      tileSelection.position.y,
    );
    if (!tile) return null;

    return {
      position: tileSelection.position,
      zLevel: tileSelection.zLevel,
      tile,
    };
  }, [selection, world]);
}

/**
 * Get entity selection info
 * Returns null if selection is not an entity
 */
export function useSelectedEntity(): EntitySelection | null {
  const selection = useGameStore((state) => state.selection);

  if (selection.type !== "entity") {
    return null;
  }

  return selection as EntitySelection;
}

/**
 * Get selection actions
 */
export function useSelectionActions() {
  const selectTile = useGameStore((state) => state.selectTile);
  const selectEntity = useGameStore((state) => state.selectEntity);
  const clearSelection = useGameStore((state) => state.clearSelection);

  return { selectTile, selectEntity, clearSelection };
}

// Stable empty set to avoid creating new objects
const EMPTY_SET: Set<string> = new Set();

/**
 * Get selected entity IDs as a Set (works for both single and multi-selection)
 */
export function useSelectedEntityIds(): Set<string> {
  const selection = useGameStore((state) => state.selection);

  return useMemo(() => {
    if (selection.type === "entity") {
      return new Set([selection.entityId]);
    }
    if (selection.type === "multi-entity") {
      return selection.entityIds;
    }
    return EMPTY_SET;
  }, [selection]);
}

/**
 * Check if a specific entity is selected
 */
export function useIsEntitySelected(entityId: string): boolean {
  return useGameStore((state) => {
    const { selection } = state;
    if (selection.type === "entity") {
      return selection.entityId === entityId;
    }
    if (selection.type === "multi-entity") {
      return selection.entityIds.has(entityId);
    }
    return false;
  });
}

/**
 * Get multi-selection actions
 */
export function useMultiSelectionActions() {
  const addToSelection = useGameStore((state) => state.addToSelection);
  const removeFromSelection = useGameStore(
    (state) => state.removeFromSelection,
  );
  const toggleSelection = useGameStore((state) => state.toggleSelection);
  const selectMultiple = useGameStore((state) => state.selectMultiple);

  return useMemo(
    () => ({
      addToSelection,
      removeFromSelection,
      toggleSelection,
      selectMultiple,
    }),
    [addToSelection, removeFromSelection, toggleSelection, selectMultiple],
  );
}

/**
 * Get the tile at the selected position (if tile is selected)
 */
export function useSelectedTileData(): Tile | null {
  const selectedTile = useSelectedTile();
  return selectedTile?.tile ?? null;
}
