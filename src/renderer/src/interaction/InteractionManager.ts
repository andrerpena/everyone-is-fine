// =============================================================================
// INTERACTION MANAGER
// =============================================================================

import { modalStateStore } from "../components/floating/modal";
import type { InteractionMode } from "../game-state/types";
import type { Position2D, Tile, World } from "../world/types";
import { getTileAt } from "../world/utils/tile-utils";
import type {
  InteractionContext,
  InteractionManagerConfig,
  InteractionModeHandler,
  PointerEventData,
} from "./types";

/**
 * Manages Pixi input events and routes them to appropriate mode handlers
 *
 * The InteractionManager:
 * 1. Converts screen coordinates to world coordinates
 * 2. Routes events to the active mode handler
 * 3. Manages mode handler registration and switching
 */
export class InteractionManager {
  private handlers = new Map<InteractionMode, InteractionModeHandler>();
  private currentMode: InteractionMode = "select";
  private world: World | null = null;
  private zLevel = 0;
  private config: InteractionManagerConfig;

  constructor(config: InteractionManagerConfig) {
    this.config = config;
  }

  // ===========================================================================
  // CONFIGURATION
  // ===========================================================================

  /**
   * Register a mode handler
   * EXTENSION POINT: Register new mode handlers here
   */
  registerModeHandler(handler: InteractionModeHandler): void {
    this.handlers.set(handler.mode, handler);
  }

  /**
   * Unregister a mode handler
   */
  unregisterModeHandler(mode: InteractionMode): void {
    this.handlers.delete(mode);
  }

  /**
   * Set the current world reference
   */
  setWorld(world: World | null): void {
    this.world = world;
  }

  /**
   * Set the current z-level
   */
  setZLevel(zLevel: number): void {
    this.zLevel = zLevel;
  }

  /**
   * Switch to a different interaction mode
   */
  setMode(mode: InteractionMode): void {
    if (mode === this.currentMode) return;

    // Deactivate current handler
    const currentHandler = this.handlers.get(this.currentMode);
    currentHandler?.onDeactivate?.();

    this.currentMode = mode;

    // Activate new handler
    const newHandler = this.handlers.get(mode);
    newHandler?.onActivate?.();
  }

  /**
   * Get current mode
   */
  getMode(): InteractionMode {
    return this.currentMode;
  }

  // ===========================================================================
  // COORDINATE CONVERSION
  // ===========================================================================

  /**
   * Convert screen/viewport coordinates to world tile coordinates
   */
  screenToWorld(localX: number, localY: number): Position2D {
    return {
      x: Math.floor(localX / this.config.cellSize),
      y: Math.floor(localY / this.config.cellSize),
    };
  }

  /**
   * Check if a position is within world bounds
   */
  isInBounds(position: Position2D): boolean {
    if (!this.world) return false;
    const level = this.world.levels.get(this.zLevel);
    if (!level) return false;

    return (
      position.x >= 0 &&
      position.x < level.width &&
      position.y >= 0 &&
      position.y < level.height
    );
  }

  /**
   * Get tile at position
   */
  getTileAtPosition(position: Position2D): Tile | null {
    if (!this.world) return null;
    const level = this.world.levels.get(this.zLevel);
    if (!level) return null;
    return getTileAt(level, position.x, position.y) ?? null;
  }

  // ===========================================================================
  // EVENT HANDLING
  // ===========================================================================

  /**
   * Build interaction context from pointer event
   */
  private buildContext(event: PointerEventData): InteractionContext | null {
    if (!this.world) return null;

    const worldPosition = this.screenToWorld(event.localX, event.localY);

    if (!this.isInBounds(worldPosition)) {
      return null;
    }

    const tile = this.getTileAtPosition(worldPosition);

    return {
      worldPosition,
      screenPosition: { x: event.screenX, y: event.screenY },
      localPosition: { x: event.localX, y: event.localY },
      zLevel: this.zLevel,
      tile,
      world: this.world,
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      button: event.button,
    };
  }

  /**
   * Handle pointer down event
   */
  handlePointerDown(event: PointerEventData): void {
    // Block interactions when modal is open
    if (modalStateStore.isModalOpen()) return;

    // Handle left and right click
    if (event.button !== 0 && event.button !== 2) return;

    const ctx = this.buildContext(event);
    if (!ctx) return;

    const handler = this.handlers.get(this.currentMode);
    handler?.onPointerDown?.(ctx);
  }

  /**
   * Handle pointer up event
   */
  handlePointerUp(event: PointerEventData): void {
    // Block interactions when modal is open
    if (modalStateStore.isModalOpen()) return;

    // Handle left and right click
    if (event.button !== 0 && event.button !== 2) return;

    const ctx = this.buildContext(event);
    if (!ctx) return;

    const handler = this.handlers.get(this.currentMode);
    handler?.onPointerUp?.(ctx);
  }

  /**
   * Handle pointer move event (while pressed)
   */
  handlePointerMove(event: PointerEventData): void {
    // Block interactions when modal is open
    if (modalStateStore.isModalOpen()) return;

    const ctx = this.buildContext(event);
    if (!ctx) return;

    const handler = this.handlers.get(this.currentMode);
    handler?.onPointerMove?.(ctx);
  }

  /**
   * Handle hover event (pointer move without press)
   */
  handleHover(event: PointerEventData): void {
    // Block interactions when modal is open
    if (modalStateStore.isModalOpen()) return;

    const ctx = this.buildContext(event);

    if (!ctx) {
      // Pointer is outside world bounds
      const handler = this.handlers.get(this.currentMode);
      handler?.onHoverEnd?.();
      return;
    }

    const handler = this.handlers.get(this.currentMode);
    handler?.onHover?.(ctx);
  }

  /**
   * Handle hover end (pointer left the canvas)
   */
  handleHoverEnd(): void {
    // Note: We don't block this - hover should end when modal opens
    const handler = this.handlers.get(this.currentMode);
    handler?.onHoverEnd?.();
  }

  // ===========================================================================
  // CLEANUP
  // ===========================================================================

  /**
   * Clean up resources
   */
  destroy(): void {
    // Deactivate current handler
    const currentHandler = this.handlers.get(this.currentMode);
    currentHandler?.onDeactivate?.();

    this.handlers.clear();
    this.world = null;
  }
}
