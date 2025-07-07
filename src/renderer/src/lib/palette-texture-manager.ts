// =============================================================================
// PALETTE TEXTURE MANAGER
// =============================================================================
// Manages sprite textures with runtime palette color replacement.
// All textures are canvas-backed so they can be updated in place when palette
// colors change — Pixi automatically picks up the new pixels on the next frame.

import { Assets, Texture } from "pixi.js";
import { useGameColorStore } from "../theming/game-color-store";

/** Parsed RGBA tuple for fast pixel comparison and replacement */
type RGBA = [number, number, number, number];

/**
 * Parse a "#RRGGBB" hex string into an RGBA tuple with alpha 255.
 */
function hexToRGBA(hex: string): RGBA {
  const h = hex.startsWith("#") ? hex.slice(1) : hex;
  return [
    Number.parseInt(h.slice(0, 2), 16),
    Number.parseInt(h.slice(2, 4), 16),
    Number.parseInt(h.slice(4, 6), 16),
    255,
  ];
}

/**
 * Build a numeric key from RGB values for fast Map lookups.
 */
function rgbKey(r: number, g: number, b: number): number {
  return (r << 16) | (g << 8) | b;
}

interface CanvasEntry {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  texture: Texture;
  /** The original source image to redraw from */
  sourceImage: CanvasImageSource;
  width: number;
  height: number;
}

export class PaletteTextureManager {
  /** Numeric RGB key → replacement RGBA tuple */
  private replacementMap = new Map<number, RGBA>();

  /** Whether there are any active replacements */
  private hasReplacements = false;

  /** URL → canvas-backed texture entry */
  private entries = new Map<string, CanvasEntry>();

  /** Unsubscribe from the game color store */
  private unsubscribe: (() => void) | null = null;

  constructor() {
    // Initialize from current store state
    const { resolved } = useGameColorStore.getState();
    this.buildReplacementMap(resolved.palette.replacementMap);

    // Subscribe to future palette changes
    this.unsubscribe = useGameColorStore.subscribe((state, prev) => {
      if (
        state.resolved.palette.replacementMap !==
        prev.resolved.palette.replacementMap
      ) {
        this.buildReplacementMap(state.resolved.palette.replacementMap);
        this.refreshAll();
      }
    });
  }

  /**
   * Load a texture with palette replacement applied.
   * Always returns a canvas-backed texture so it can be updated in place later.
   */
  async loadTexture(url: string): Promise<Texture> {
    const existing = this.entries.get(url);
    if (existing) return existing.texture;

    const original = await Assets.load<Texture>(url);
    const width = original.source.width;
    const height = original.source.height;
    const sourceImage = original.source.resource as CanvasImageSource;

    // Create a canvas copy of the texture
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return original;

    // Draw the original and apply any current replacements
    ctx.drawImage(sourceImage, 0, 0, width, height);
    if (this.hasReplacements) {
      this.replacePixels(ctx, width, height);
    }

    // Create a Pixi texture from our canvas
    const texture = Texture.from(canvas);
    texture.source.scaleMode = "nearest";

    this.entries.set(url, { canvas, ctx, texture, sourceImage, width, height });
    return texture;
  }

  /**
   * Clean up the store subscription.
   */
  destroy(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  /**
   * Build the numeric replacement map from the store's hex string map.
   */
  private buildReplacementMap(map: Map<string, string>): void {
    this.replacementMap.clear();
    for (const [baseHex, overrideHex] of map) {
      const baseRgba = hexToRGBA(baseHex);
      const overrideRgba = hexToRGBA(overrideHex);
      this.replacementMap.set(
        rgbKey(baseRgba[0], baseRgba[1], baseRgba[2]),
        overrideRgba,
      );
    }
    this.hasReplacements = this.replacementMap.size > 0;
  }

  /**
   * Redraw ALL canvas textures from their originals with current replacements.
   * Since the Pixi textures reference these canvases, calling source.update()
   * causes Pixi to re-upload the texture data — all sprites update automatically.
   */
  private refreshAll(): void {
    for (const entry of this.entries.values()) {
      // Redraw from original source
      entry.ctx.clearRect(0, 0, entry.width, entry.height);
      entry.ctx.drawImage(entry.sourceImage, 0, 0, entry.width, entry.height);

      // Apply replacements if any
      if (this.hasReplacements) {
        this.replacePixels(entry.ctx, entry.width, entry.height);
      }

      // Tell Pixi to re-upload this texture to the GPU
      entry.texture.source.update();
    }
  }

  /**
   * Replace matching palette pixels in the canvas context.
   */
  private replacePixels(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ): void {
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;

    let modified = false;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] === 0) continue;

      const key = rgbKey(pixels[i], pixels[i + 1], pixels[i + 2]);
      const replacement = this.replacementMap.get(key);
      if (replacement) {
        pixels[i] = replacement[0];
        pixels[i + 1] = replacement[1];
        pixels[i + 2] = replacement[2];
        pixels[i + 3] = replacement[3];
        modified = true;
      }
    }

    if (modified) {
      ctx.putImageData(imageData, 0, 0);
    }
  }
}
