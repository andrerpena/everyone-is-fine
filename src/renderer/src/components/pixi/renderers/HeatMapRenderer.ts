// =============================================================================
// HEAT MAP RENDERER
// =============================================================================
// Renders heat map overlays for visualization layers

import { type Container, Graphics } from "pixi.js";
import { getColorFromScale } from "../../../layers/color-scales";
import { layerRegistry } from "../../../layers/layer-registry";
import type {
  HeatMapLayerDefinition,
  LayerVisibilityMap,
} from "../../../layers/types";
import type { ZLevel } from "../../../world/types";

// =============================================================================
// HEAT MAP RENDERER CLASS
// =============================================================================

/**
 * Renders heat map overlays for visualization layers.
 * Each heat map layer gets its own Graphics object for independent visibility control.
 */
export class HeatMapRenderer {
  private parentContainer: Container;
  private cellSize: number;
  private layerGraphics: Map<string, Graphics> = new Map();

  constructor(parentContainer: Container, cellSize: number) {
    this.parentContainer = parentContainer;
    this.cellSize = cellSize;
  }

  /**
   * Update heat map overlays based on level data and visibility.
   *
   * @param level - The current z-level to render
   * @param visibility - Layer visibility map from the store
   */
  update(level: ZLevel, visibility: LayerVisibilityMap): void {
    const heatMapLayers = layerRegistry.getHeatMapLayers();

    for (const layer of heatMapLayers) {
      const isVisible = visibility.get(layer.id) ?? false;
      let graphics = this.layerGraphics.get(layer.id);

      if (!isVisible) {
        // Hide if exists
        if (graphics) {
          graphics.visible = false;
        }
        continue;
      }

      // Create graphics if needed
      if (!graphics) {
        graphics = new Graphics();
        this.layerGraphics.set(layer.id, graphics);
        this.parentContainer.addChild(graphics);
      }

      graphics.visible = true;
      this.renderHeatMapLayer(graphics, level, layer);
    }
  }

  /**
   * Render a single heat map layer.
   */
  private renderHeatMapLayer(
    graphics: Graphics,
    level: ZLevel,
    layer: HeatMapLayerDefinition,
  ): void {
    graphics.clear();

    for (let y = 0; y < level.height; y++) {
      for (let x = 0; x < level.width; x++) {
        const tile = level.tiles[y * level.width + x];
        const value = layer.getValue(tile);
        const color = getColorFromScale(layer.colorScale, value);

        const px = x * this.cellSize;
        const py = y * this.cellSize;

        graphics.rect(px, py, this.cellSize, this.cellSize);
        graphics.fill({ color, alpha: layer.opacity });
      }
    }
  }

  /**
   * Set visibility for all heat map layers at once.
   */
  setAllVisible(visible: boolean): void {
    for (const graphics of this.layerGraphics.values()) {
      graphics.visible = visible;
    }
  }

  /**
   * Clean up all graphics.
   */
  destroy(): void {
    for (const graphics of this.layerGraphics.values()) {
      this.parentContainer.removeChild(graphics);
      graphics.destroy();
    }
    this.layerGraphics.clear();
  }
}
