// =============================================================================
// CHARACTER RENDERER
// =============================================================================
// Renders characters as sprites with direction indicators

import type { PaletteTextureManager } from "@renderer/lib/palette-texture-manager";
import { Container, Graphics, Sprite, type Texture } from "pixi.js";
import type { JobProgressInfo } from "../../../simulation/jobs/types";
import {
  type Direction,
  getCharacterCenterPosition,
  getCharacterDirection,
} from "../../../simulation/movement";
import type { Character, EntityId } from "../../../simulation/types";
import type { ResolvedGameColors } from "../../../theming/game-color-store";

// =============================================================================
// CONSTANTS
// =============================================================================

/** Character sprite half-size for positioning calculations */
const CHARACTER_HALF_SIZE = 16;

/** Direction indicator length */
const DIRECTION_INDICATOR_LENGTH = 8;

/** Selection ring padding */
const SELECTION_PADDING = 4;

const JOB_INDICATOR_RADIUS = 4;
const JOB_INDICATOR_Y_OFFSET = -22;

// =============================================================================
// CHARACTER GRAPHICS
// =============================================================================

interface CharacterGraphics {
  container: Container;
  body: Sprite;
  directionIndicator: Graphics;
  selectionRing: Graphics;
  jobIndicator: Graphics;
}

/** Character sprite size (32x32 pixels, fits one cell) */
const CHARACTER_SPRITE_SIZE = 32;

/** Character sprite path */
export const CHARACTER_SPRITE_PATH = "/sprites/characters/male-1/male-1.png";

// =============================================================================
// CHARACTER RENDERER CLASS
// =============================================================================

/**
 * Renders characters as sprites with direction indicators.
 * Manages a pool of graphics objects for efficient rendering.
 */
export class CharacterRenderer {
  private parentContainer: Container;
  private cellSize: number;
  private graphics: Map<EntityId, CharacterGraphics> = new Map();
  private colors: ResolvedGameColors;

  /** Cached character texture (loaded via preloadAssets) */
  private static characterTexture: Texture | null = null;

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
   * Preload character sprite assets. Call this before creating any CharacterRenderer instances.
   */
  static async preloadAssets(
    textureManager: PaletteTextureManager,
  ): Promise<void> {
    if (CharacterRenderer.characterTexture) {
      return;
    }
    try {
      CharacterRenderer.characterTexture = await textureManager.loadTexture(
        CHARACTER_SPRITE_PATH,
      );
    } catch (error) {
      console.error(
        "[CharacterRenderer] Failed to load character texture:",
        error,
      );
    }
  }

  /**
   * Update all character graphics.
   *
   * @param characters - Map of all characters to render
   * @param selectedIds - Set of selected character IDs (supports multi-selection)
   * @param zLevel - Current z-level to filter characters by (optional)
   * @param jobProgress - Active job progress info per character (optional)
   */
  update(
    characters: Map<EntityId, Character>,
    selectedIds: Set<EntityId>,
    zLevel?: number,
    jobProgress?: Map<EntityId, JobProgressInfo>,
  ): void {
    // Track which characters we've seen
    const seenIds = new Set<EntityId>();

    // Update or create graphics for each character
    for (const [id, character] of characters) {
      // Filter by z-level if provided
      if (zLevel !== undefined && character.position.z !== zLevel) {
        continue;
      }

      seenIds.add(id);

      let charGraphics = this.graphics.get(id);

      if (!charGraphics) {
        // Create new graphics for this character
        charGraphics = this.createCharacterGraphics(character);
        this.graphics.set(id, charGraphics);
        this.parentContainer.addChild(charGraphics.container);
      }

      // Update position and appearance
      const jobInfo = jobProgress?.get(id) ?? null;
      this.updateCharacterGraphics(
        charGraphics,
        character,
        selectedIds.has(id),
        jobInfo?.jobType ?? null,
      );
    }

    // Remove graphics for characters that no longer exist
    for (const [id, charGraphics] of this.graphics) {
      if (!seenIds.has(id)) {
        this.parentContainer.removeChild(charGraphics.container);
        charGraphics.container.destroy({ children: true });
        this.graphics.delete(id);
      }
    }
  }

  /**
   * Create graphics for a character.
   */
  private createCharacterGraphics(_character: Character): CharacterGraphics {
    const container = new Container();

    // Selection ring (drawn first, behind body)
    const selectionRing = new Graphics();
    container.addChild(selectionRing);

    // Character sprite - use preloaded texture if available, otherwise load async
    let body: Sprite;
    if (CharacterRenderer.characterTexture) {
      body = new Sprite(CharacterRenderer.characterTexture);
    } else {
      // Fallback: load async (texture will appear once loaded)
      body = Sprite.from(CHARACTER_SPRITE_PATH);
    }
    // Center the sprite anchor so it's positioned at the character center
    body.anchor.set(0.5, 0.5);
    // Ensure sprite fits exactly in one cell (32x32)
    body.width = CHARACTER_SPRITE_SIZE;
    body.height = CHARACTER_SPRITE_SIZE;
    container.addChild(body);

    // Direction indicator
    const directionIndicator = new Graphics();
    container.addChild(directionIndicator);

    // Job indicator (hidden by default)
    const jobIndicator = new Graphics();
    jobIndicator.visible = false;
    container.addChild(jobIndicator);

    return {
      container,
      body,
      directionIndicator,
      selectionRing,
      jobIndicator,
    };
  }

  /**
   * Draw the direction indicator.
   */
  private drawDirectionIndicator(
    graphics: Graphics,
    direction: Direction,
    color: number,
  ): void {
    graphics.clear();

    if (direction === "none") {
      return;
    }

    // Calculate direction vector
    let dx = 0;
    let dy = 0;

    switch (direction) {
      case "north":
        dy = -1;
        break;
      case "south":
        dy = 1;
        break;
      case "east":
        dx = 1;
        break;
      case "west":
        dx = -1;
        break;
    }

    // Draw triangle pointing in direction
    const tipX = dx * (CHARACTER_HALF_SIZE + DIRECTION_INDICATOR_LENGTH);
    const tipY = dy * (CHARACTER_HALF_SIZE + DIRECTION_INDICATOR_LENGTH);
    const baseX = dx * CHARACTER_HALF_SIZE;
    const baseY = dy * CHARACTER_HALF_SIZE;

    // Perpendicular offset for triangle base
    const perpX = -dy * 4;
    const perpY = dx * 4;

    graphics.moveTo(tipX, tipY);
    graphics.lineTo(baseX + perpX, baseY + perpY);
    graphics.lineTo(baseX - perpX, baseY - perpY);
    graphics.closePath();
    graphics.fill(color);
  }

  /**
   * Draw the selection ring.
   */
  private drawSelectionRing(graphics: Graphics, isSelected: boolean): void {
    graphics.clear();

    if (!isSelected) {
      return;
    }

    const highlightColor = this.colors.selection.highlight;
    const radius = CHARACTER_HALF_SIZE + SELECTION_PADDING;

    graphics.circle(0, 0, radius);
    graphics.stroke({ width: 3, color: highlightColor });

    // Animated corners (could add animation later)
    const cornerSize = 6;
    const offset = radius - 2;

    // Top-left
    graphics.moveTo(-offset, -offset + cornerSize);
    graphics.lineTo(-offset, -offset);
    graphics.lineTo(-offset + cornerSize, -offset);
    graphics.stroke({ width: 2, color: highlightColor });

    // Top-right
    graphics.moveTo(offset - cornerSize, -offset);
    graphics.lineTo(offset, -offset);
    graphics.lineTo(offset, -offset + cornerSize);
    graphics.stroke({ width: 2, color: highlightColor });

    // Bottom-left
    graphics.moveTo(-offset, offset - cornerSize);
    graphics.lineTo(-offset, offset);
    graphics.lineTo(-offset + cornerSize, offset);
    graphics.stroke({ width: 2, color: highlightColor });

    // Bottom-right
    graphics.moveTo(offset - cornerSize, offset);
    graphics.lineTo(offset, offset);
    graphics.lineTo(offset, offset - cornerSize);
    graphics.stroke({ width: 2, color: highlightColor });
  }

  /**
   * Draw the job indicator dot above the character.
   */
  private drawJobIndicator(graphics: Graphics, jobType: string | null): void {
    graphics.clear();

    if (!jobType) {
      graphics.visible = false;
      return;
    }

    graphics.visible = true;
    const color =
      this.colors.jobs.byType[jobType] ?? this.colors.jobs.defaultJob;

    graphics.circle(0, JOB_INDICATOR_Y_OFFSET, JOB_INDICATOR_RADIUS);
    graphics.fill(color);
    graphics.circle(0, JOB_INDICATOR_Y_OFFSET, JOB_INDICATOR_RADIUS);
    graphics.stroke({
      width: 1,
      color: this.colors.jobs.indicatorBorder,
      alpha: 0.5,
    });
  }

  /**
   * Update a character's graphics with current state.
   */
  private updateCharacterGraphics(
    charGraphics: CharacterGraphics,
    character: Character,
    isSelected: boolean,
    jobType: string | null,
  ): void {
    // Update position
    const center = getCharacterCenterPosition(character, this.cellSize);
    charGraphics.container.x = center.x;
    charGraphics.container.y = center.y;

    // Update direction indicator
    const direction = getCharacterDirection(character);
    this.drawDirectionIndicator(
      charGraphics.directionIndicator,
      direction,
      character.color,
    );

    // Update selection ring
    this.drawSelectionRing(charGraphics.selectionRing, isSelected);

    // Update job indicator
    this.drawJobIndicator(charGraphics.jobIndicator, jobType);
  }

  /**
   * Clean up all graphics.
   */
  destroy(): void {
    for (const [, charGraphics] of this.graphics) {
      this.parentContainer.removeChild(charGraphics.container);
      charGraphics.container.destroy({ children: true });
    }
    this.graphics.clear();
  }

  /**
   * Get the character at a pixel position (for hit testing).
   *
   * @param x - Pixel X coordinate
   * @param y - Pixel Y coordinate
   * @param characters - Map of characters to check
   * @returns The character at the position, or null
   */
  getCharacterAtPosition(
    x: number,
    y: number,
    characters: Map<EntityId, Character>,
  ): Character | null {
    for (const [, character] of characters) {
      const center = getCharacterCenterPosition(character, this.cellSize);
      const dx = x - center.x;
      const dy = y - center.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= CHARACTER_HALF_SIZE + 4) {
        return character;
      }
    }

    return null;
  }
}
