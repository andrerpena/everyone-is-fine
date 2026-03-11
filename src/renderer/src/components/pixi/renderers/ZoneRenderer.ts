// =============================================================================
// ZONE RENDERER
// =============================================================================
// Renders colored semi-transparent rectangles over zone-designated tiles.

import { type Container, Graphics } from "pixi.js";
import type { ZoneData } from "../../../zones/types";
import { ZONE_ALPHA, ZONE_COLORS } from "../../../zones/types";

export class ZoneRenderer {
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
   * Re-render all zone overlays for the given z-level.
   */
  update(zones: ZoneData[], zLevel: number): void {
    this.graphics.clear();

    for (const zone of zones) {
      if (zone.zLevel !== zLevel) continue;
      if (zone.tiles.size === 0) continue;

      const color = ZONE_COLORS[zone.type] ?? 0xffffff;

      for (const tileKey of zone.tiles) {
        const [xStr, yStr] = tileKey.split(",");
        const x = Number(xStr);
        const y = Number(yStr);

        const px = x * this.cellSize;
        const py = y * this.cellSize;

        this.graphics.rect(px, py, this.cellSize, this.cellSize);
        this.graphics.fill({ color, alpha: ZONE_ALPHA });
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
