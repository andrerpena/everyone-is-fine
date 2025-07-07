// =============================================================================
// PIXI INTERACTION HOOK
// =============================================================================

import type { Container, FederatedPointerEvent } from "pixi.js";
import { useCallback, useEffect, useRef } from "react";
import { useGameStore } from "../game-state/store";
import type { World } from "../world/types";
import { InteractionManager } from "./InteractionManager";
import { selectModeHandler } from "./modes/SelectMode";
import type { PointerEventData } from "./types";

interface UsePixiInteractionOptions {
  /** Pixi container to attach events to */
  container: Container | null;
  /** World reference */
  world: World | null;
  /** Current z-level */
  zLevel: number;
  /** Size of each cell in pixels */
  cellSize: number;
}

/**
 * Hook to wire up Pixi interaction events to the InteractionManager
 */
export function usePixiInteraction({
  container,
  world,
  zLevel,
  cellSize,
}: UsePixiInteractionOptions): InteractionManager | null {
  const managerRef = useRef<InteractionManager | null>(null);

  // Initialize manager
  useEffect(() => {
    if (!managerRef.current) {
      managerRef.current = new InteractionManager({ cellSize });

      // Register mode handlers
      managerRef.current.registerModeHandler(selectModeHandler);
    }

    return () => {
      managerRef.current?.destroy();
      managerRef.current = null;
    };
  }, [cellSize]);

  // Update manager with world and zLevel
  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.setWorld(world);
      managerRef.current.setZLevel(zLevel);
    }
  }, [world, zLevel]);

  // Sync interaction mode from store
  useEffect(() => {
    const unsubscribe = useGameStore.subscribe((state) => {
      managerRef.current?.setMode(state.interactionMode);
    });
    return unsubscribe;
  }, []);

  // Create event handler helpers
  const createEventData = useCallback(
    (event: FederatedPointerEvent): PointerEventData => {
      // Get local position within the container
      const localPoint = event.getLocalPosition(
        event.currentTarget as Container,
      );

      return {
        screenX: event.global.x,
        screenY: event.global.y,
        localX: localPoint.x,
        localY: localPoint.y,
        shiftKey: event.shiftKey,
        ctrlKey: event.ctrlKey || event.metaKey,
        altKey: event.altKey,
        button: event.button,
      };
    },
    [],
  );

  // Attach event listeners
  useEffect(() => {
    if (!container || !managerRef.current) return;

    const manager = managerRef.current;

    // Make container interactive
    container.eventMode = "static";
    container.cursor = "pointer";

    const handlePointerDown = (event: FederatedPointerEvent) => {
      manager.handlePointerDown(createEventData(event));
    };

    const handlePointerUp = (event: FederatedPointerEvent) => {
      manager.handlePointerUp(createEventData(event));
    };

    const handlePointerMove = (event: FederatedPointerEvent) => {
      // Check if any button is pressed (for drag)
      if (event.buttons > 0) {
        manager.handlePointerMove(createEventData(event));
      } else {
        manager.handleHover(createEventData(event));
      }
    };

    const handlePointerLeave = () => {
      manager.handleHoverEnd();
    };

    // Attach listeners
    container.on("pointerdown", handlePointerDown);
    container.on("pointerup", handlePointerUp);
    container.on("pointermove", handlePointerMove);
    container.on("pointerleave", handlePointerLeave);

    return () => {
      container.off("pointerdown", handlePointerDown);
      container.off("pointerup", handlePointerUp);
      container.off("pointermove", handlePointerMove);
      container.off("pointerleave", handlePointerLeave);
    };
  }, [container, createEventData]);

  return managerRef.current;
}
