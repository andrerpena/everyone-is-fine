// =============================================================================
// FOG OF WAR RENDERER
// =============================================================================
// Renders darkness over unexplored tiles and a dimming overlay on explored
// but not currently visible tiles. Visible tiles (near colonists) are clear.

import { type Container, Graphics } from "pixi.js";
import type { ZLevel } from "../../../world/types";

/** Alpha for completely unexplored tiles (near-black) */
const UNEXPLORED_ALPHA = 0.85;

/** Alpha for explored but not currently visible tiles (dimmed) */
const EXPLORED_DIM_ALPHA = 0.4;

export class FogOfWarRenderer {
  private parentContainer: Container;
  private graphics: Graphics;
  private cellSize: number;

  constructor(parentContainer: Container, cellSize: number) {
    this.parentContainer = parentContainer;
    this.cellSize = cellSize;
    this.graphics = new Graphics();
    this.parentContainer.addChild(this.graphics);
  }

  /**
   * Re-render the fog of war overlay for the given z-level.
   */
  update(level: ZLevel): void {
    this.graphics.clear();

    for (let y = 0; y < level.height; y++) {
      for (let x = 0; x < level.width; x++) {
        const tile = level.tiles[y * level.width + x];
        const { explored, visible } = tile.visibility;

        if (visible) continue; // Fully lit — no overlay

        const alpha = explored ? EXPLORED_DIM_ALPHA : UNEXPLORED_ALPHA;
        const px = x * this.cellSize;
        const py = y * this.cellSize;

        this.graphics.rect(px, py, this.cellSize, this.cellSize);
        this.graphics.fill({ color: 0x000000, alpha });
      }
    }
  }

  setVisible(visible: boolean): void {
    this.graphics.visible = visible;
  }

  destroy(): void {
    this.parentContainer.removeChild(this.graphics);
    this.graphics.destroy();
  }
}
