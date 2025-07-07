import type { SimpleViewport } from "./SimpleViewport";

/**
 * Store that holds the single viewport reference.
 * Provides access to viewport operations (pan, zoom) for
 * external consumers like the mini-map and control bars.
 */
class ViewportStore {
  private viewport: SimpleViewport | null = null;

  setViewport(viewport: SimpleViewport | null): void {
    this.viewport = viewport;
  }

  getViewport(): SimpleViewport | null {
    return this.viewport;
  }

  panTo(worldX: number, worldY: number): void {
    this.viewport?.panTo(worldX, worldY);
  }

  setZoom(scale: number): void {
    this.viewport?.setZoom(scale);
  }

  getZoom(): number {
    return this.viewport?.getZoom() ?? 1;
  }
}

export const viewportStore = new ViewportStore();
