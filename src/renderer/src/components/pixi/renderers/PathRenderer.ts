// =============================================================================
// PATH RENDERER
// =============================================================================
// Renders character movement paths as dotted lines

import { type Container, Graphics } from "pixi.js";
import { getCharacterCenterPosition } from "../../../simulation/movement";
import type { Character } from "../../../simulation/types";
import type { ResolvedGameColors } from "../../../theming/game-color-store";
import type { Position3D } from "../../../world/types";

// =============================================================================
// CONSTANTS
// =============================================================================

/** Path line alpha */
const PATH_ALPHA = 0.6;

/** Dash length for dotted line */
const DASH_LENGTH = 6;

/** Gap length for dotted line */
const GAP_LENGTH = 4;

/** Destination marker size */
const DESTINATION_SIZE = 8;

// =============================================================================
// PATH RENDERER CLASS
// =============================================================================

/**
 * Renders movement paths for selected characters.
 */
export class PathRenderer {
  private graphics: Graphics;
  private cellSize: number;
  private colors: ResolvedGameColors;

  constructor(
    parentContainer: Container,
    cellSize: number,
    colors: ResolvedGameColors,
  ) {
    this.graphics = new Graphics();
    this.cellSize = cellSize;
    this.colors = colors;
    parentContainer.addChild(this.graphics);
  }

  /**
   * Update the colors used by this renderer.
   */
  updateColors(colors: ResolvedGameColors): void {
    this.colors = colors;
  }

  /**
   * Update the path visualization.
   *
   * @param character - The selected character (or null if none)
   */
  update(character: Character | null): void {
    this.graphics.clear();

    if (
      !character ||
      !character.movement.path ||
      !character.movement.isMoving
    ) {
      return;
    }

    const { path, pathIndex } = character.movement;

    if (pathIndex >= path.length - 1) {
      return;
    }

    // Get current visual position
    const start = getCharacterCenterPosition(character, this.cellSize);

    // Draw path from current position
    let prevX = start.x;
    let prevY = start.y;

    const pathColor = this.colors.selection.pathLine;

    for (let i = pathIndex + 1; i < path.length; i++) {
      const waypoint = path[i];
      const waypointX = waypoint.x * this.cellSize + this.cellSize / 2;
      const waypointY = waypoint.y * this.cellSize + this.cellSize / 2;

      // Draw dotted line segment
      this.drawDottedLine(prevX, prevY, waypointX, waypointY);

      // Draw small waypoint marker (except for destination)
      if (i < path.length - 1) {
        this.graphics.circle(waypointX, waypointY, 3);
        this.graphics.fill({ color: pathColor, alpha: PATH_ALPHA * 0.5 });
      }

      prevX = waypointX;
      prevY = waypointY;
    }

    // Draw destination marker
    const destination = path[path.length - 1];
    this.drawDestinationMarker(destination);
  }

  /**
   * Draw a dotted line between two points.
   */
  private drawDottedLine(x1: number, y1: number, x2: number, y2: number): void {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return;

    // Normalize direction
    const nx = dx / distance;
    const ny = dy / distance;

    // Draw dashes
    const totalPattern = DASH_LENGTH + GAP_LENGTH;
    let currentDistance = 0;

    const pathColor = this.colors.selection.pathLine;

    while (currentDistance < distance) {
      const dashStart = currentDistance;
      const dashEnd = Math.min(currentDistance + DASH_LENGTH, distance);

      const startX = x1 + nx * dashStart;
      const startY = y1 + ny * dashStart;
      const endX = x1 + nx * dashEnd;
      const endY = y1 + ny * dashEnd;

      this.graphics.moveTo(startX, startY);
      this.graphics.lineTo(endX, endY);
      this.graphics.stroke({
        width: 2,
        color: pathColor,
        alpha: PATH_ALPHA,
      });

      currentDistance += totalPattern;
    }
  }

  /**
   * Draw a marker at the destination.
   */
  private drawDestinationMarker(position: Position3D): void {
    const x = position.x * this.cellSize + this.cellSize / 2;
    const y = position.y * this.cellSize + this.cellSize / 2;
    const size = DESTINATION_SIZE;

    const pathColor = this.colors.selection.pathLine;

    // Draw X marker
    this.graphics.moveTo(x - size, y - size);
    this.graphics.lineTo(x + size, y + size);
    this.graphics.stroke({ width: 3, color: pathColor, alpha: PATH_ALPHA });

    this.graphics.moveTo(x + size, y - size);
    this.graphics.lineTo(x - size, y + size);
    this.graphics.stroke({ width: 3, color: pathColor, alpha: PATH_ALPHA });

    // Draw circle around X
    this.graphics.circle(x, y, size + 4);
    this.graphics.stroke({
      width: 2,
      color: pathColor,
      alpha: PATH_ALPHA * 0.5,
    });
  }

  /**
   * Clean up graphics.
   */
  destroy(): void {
    this.graphics.destroy();
  }
}
