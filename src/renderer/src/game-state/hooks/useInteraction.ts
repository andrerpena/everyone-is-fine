// =============================================================================
// INTERACTION STATE HOOKS
// =============================================================================

import type { Position2D } from "../../world/types";
import { useGameStore } from "../store";
import type { InteractionMode } from "../types";

/**
 * Get the current interaction mode
 */
export function useInteractionMode(): InteractionMode {
  return useGameStore((state) => state.interactionMode);
}

/**
 * Get the current hover position (tile being hovered)
 */
export function useHoverPosition(): Position2D | null {
  return useGameStore((state) => state.hoverPosition);
}

/**
 * Get interaction actions
 */
export function useInteractionActions() {
  const setInteractionMode = useGameStore((state) => state.setInteractionMode);
  const setHoverPosition = useGameStore((state) => state.setHoverPosition);

  return { setInteractionMode, setHoverPosition };
}

/**
 * Check if a specific interaction mode is active
 */
export function useIsInteractionMode(mode: InteractionMode): boolean {
  return useGameStore((state) => state.interactionMode === mode);
}
