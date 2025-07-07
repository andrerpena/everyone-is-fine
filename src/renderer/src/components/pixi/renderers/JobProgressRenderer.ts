// =============================================================================
// JOB PROGRESS RENDERER
// =============================================================================
// Renders progress bars on tiles where characters are actively working

import { Container, Graphics } from "pixi.js";
import type { JobProgressInfo } from "../../../simulation/jobs/types";
import type { EntityId } from "../../../simulation/types";
import type { ResolvedGameColors } from "../../../theming/game-color-store";

// =============================================================================
// CONSTANTS
// =============================================================================

const BAR_WIDTH = 26;
const BAR_HEIGHT = 4;
const BAR_OFFSET_Y = -2;

// =============================================================================
// TYPES
// =============================================================================

interface TileProgressGraphics {
  container: Container;
  background: Graphics;
  fill: Graphics;
  border: Graphics;
}

// =============================================================================
// JOB PROGRESS RENDERER CLASS
// =============================================================================

export class JobProgressRenderer {
  private parentContainer: Container;
  private cellSize: number;
  private graphics: Map<string, TileProgressGraphics> = new Map();
  private colors: ResolvedGameColors;

  constructor(
    parentContainer: Container,
    cellSize: number,
    colors: ResolvedGameColors,
  ) {
    this.parentContainer = parentContainer;
    this.cellSize = cellSize;
    this.colors = colors;
  }

  /**
   * Update the colors used by this renderer.
   */
  updateColors(colors: ResolvedGameColors): void {
    this.colors = colors;
  }

  /**
   * Update progress bars for all active work steps.
   */
  update(jobProgress: Map<EntityId, JobProgressInfo>): void {
    const activeTileKeys = new Set<string>();

    for (const [, info] of jobProgress) {
      if (info.progress === null) continue;

      const key = `${info.targetPosition.x},${info.targetPosition.y},${info.targetPosition.z}`;
      activeTileKeys.add(key);

      let tileGraphics = this.graphics.get(key);
      if (!tileGraphics) {
        tileGraphics = this.createProgressBar(
          info.targetPosition.x,
          info.targetPosition.y,
        );
        this.graphics.set(key, tileGraphics);
        this.parentContainer.addChild(tileGraphics.container);
      }

      this.updateProgressBar(tileGraphics, info.progress);
    }

    // Remove progress bars for tiles no longer being worked
    for (const [key, tileGraphics] of this.graphics) {
      if (!activeTileKeys.has(key)) {
        this.parentContainer.removeChild(tileGraphics.container);
        tileGraphics.container.destroy({ children: true });
        this.graphics.delete(key);
      }
    }
  }

  private createProgressBar(
    tileX: number,
    tileY: number,
  ): TileProgressGraphics {
    const container = new Container();
    container.x = tileX * this.cellSize + (this.cellSize - BAR_WIDTH) / 2;
    container.y = tileY * this.cellSize + BAR_OFFSET_Y;

    const background = new Graphics();
    background.rect(0, 0, BAR_WIDTH, BAR_HEIGHT);
    background.fill(this.colors.progressBar.background);
    container.addChild(background);

    const fill = new Graphics();
    container.addChild(fill);

    const border = new Graphics();
    border.rect(0, 0, BAR_WIDTH, BAR_HEIGHT);
    border.stroke({
      width: 1,
      color: this.colors.progressBar.border,
      alpha: 0.6,
    });
    container.addChild(border);

    return { container, background, fill, border };
  }

  private updateProgressBar(
    tileGraphics: TileProgressGraphics,
    progress: number,
  ): void {
    const clamped = Math.max(0, Math.min(1, progress));
    tileGraphics.fill.clear();
    if (clamped > 0) {
      tileGraphics.fill.rect(0, 0, BAR_WIDTH * clamped, BAR_HEIGHT);
      tileGraphics.fill.fill(this.colors.progressBar.fill);
    }
  }

  destroy(): void {
    for (const [, tileGraphics] of this.graphics) {
      this.parentContainer.removeChild(tileGraphics.container);
      tileGraphics.container.destroy({ children: true });
    }
    this.graphics.clear();
  }
}
