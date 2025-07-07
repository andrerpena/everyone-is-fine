// =============================================================================
// INTERACTION SYSTEM TYPES
// =============================================================================

import type { InteractionMode } from "../game-state/types";
import type { Position2D, Tile, World } from "../world/types";

/**
 * Context provided to interaction mode handlers
 */
export interface InteractionContext {
  /** World position (tile coordinates) of the interaction */
  worldPosition: Position2D;
  /** Screen position (pixel coordinates) of the pointer */
  screenPosition: { x: number; y: number };
  /** Local position within the viewport (pixel coordinates) */
  localPosition: { x: number; y: number };
  /** Current z-level being viewed */
  zLevel: number;
  /** The tile at the interaction position (if valid) */
  tile: Tile | null;
  /** Reference to the world */
  world: World;
  /** Whether shift key is held */
  shiftKey: boolean;
  /** Whether ctrl/cmd key is held */
  ctrlKey: boolean;
  /** Whether alt key is held */
  altKey: boolean;
  /** Pointer button (0 = left, 1 = middle, 2 = right) */
  button: number;
}

/**
 * Base interface for interaction mode handlers
 * EXTENSION POINT: Implement this interface for new interaction modes
 */
export interface InteractionModeHandler {
  /** The mode this handler is for */
  readonly mode: InteractionMode;

  /** Called when pointer is pressed down */
  onPointerDown?(ctx: InteractionContext): void;

  /** Called when pointer is released */
  onPointerUp?(ctx: InteractionContext): void;

  /** Called when pointer moves while pressed */
  onPointerMove?(ctx: InteractionContext): void;

  /** Called when pointer enters/moves over a tile */
  onHover?(ctx: InteractionContext): void;

  /** Called when pointer leaves the world area */
  onHoverEnd?(): void;

  /** Called when this mode becomes active */
  onActivate?(): void;

  /** Called when switching away from this mode */
  onDeactivate?(): void;
}

/**
 * Pointer event data from Pixi
 */
export interface PointerEventData {
  /** Global screen position */
  screenX: number;
  screenY: number;
  /** Local position within the viewport */
  localX: number;
  localY: number;
  /** Modifier keys */
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  /** Pointer button (0 = left, 1 = middle, 2 = right) */
  button: number;
}

/**
 * Configuration for the interaction manager
 */
export interface InteractionManagerConfig {
  /** Size of each tile in pixels */
  cellSize: number;
}
