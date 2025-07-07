import { CELL_SIZE } from "@renderer/components/pixi/World";
import { useGameStore } from "@renderer/game-state";
import { viewportStore } from "@renderer/lib/viewport-simple";
import {
  type ResolvedGameColors,
  useGameColorStore,
} from "@renderer/theming/game-color-store";
import type { ZLevel } from "@renderer/world/types";
import { Map as MapIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import type { WidgetComponentProps, WidgetDefinition } from "../types";

// =============================================================================
// TERRAIN IMAGE GENERATION
// =============================================================================

function generateTerrainImage(
  level: ZLevel,
  colors: ResolvedGameColors,
): ImageData {
  const { width, height, tiles } = level;
  const imageData = new ImageData(width, height);
  const data = imageData.data;

  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    const offset = i * 4;

    const color = colors.minimap.terrain[tile.terrain.type];
    data[offset] = color[0];
    data[offset + 1] = color[1];
    data[offset + 2] = color[2];
    data[offset + 3] = color[3];

    if (tile.structure && tile.structure.type !== "none") {
      const sc = colors.structures.rgba[tile.structure.type];
      if (sc) {
        data[offset] = sc[0];
        data[offset + 1] = sc[1];
        data[offset + 2] = sc[2];
        data[offset + 3] = sc[3];
      }
    }
  }

  return imageData;
}

// =============================================================================
// MINI-MAP ZOOM/PAN CONSTANTS
// =============================================================================

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 8.0;
const ZOOM_SPEED = 0.15;

// =============================================================================
// MINI-MAP HELPERS
// =============================================================================

interface MiniMapTransform {
  zoom: number;
  x: number;
  y: number;
}

function fitToCanvas(
  worldWidth: number,
  worldHeight: number,
  canvasWidth: number,
  canvasHeight: number,
): MiniMapTransform | null {
  if (worldWidth === 0 || worldHeight === 0) return null;
  const scaleX = canvasWidth / worldWidth;
  const scaleY = canvasHeight / worldHeight;
  const zoom = Math.min(scaleX, scaleY) * 0.95;
  return {
    zoom,
    x: (canvasWidth - worldWidth * zoom) / 2,
    y: (canvasHeight - worldHeight * zoom) / 2,
  };
}

function canvasToTile(
  canvasX: number,
  canvasY: number,
  pan: { x: number; y: number },
  zoom: number,
) {
  return {
    tileX: (canvasX - pan.x) / zoom,
    tileY: (canvasY - pan.y) / zoom,
  };
}

// =============================================================================
// MINI-MAP COMPONENT
// =============================================================================

function MiniMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bitmapRef = useRef<ImageBitmap | null>(null);
  const worldSizeRef = useRef({ width: 0, height: 0 });
  const dirtyRef = useRef(true);
  const isDraggingRef = useRef(false);

  // Mini-map's own independent zoom/pan (useRef to avoid React re-renders)
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });

  // Previous viewport bounds for dirty checking
  const prevBoundsRef = useRef({ left: 0, top: 0, right: 0, bottom: 0 });

  // Canvas logical size (CSS pixels, not backing store)
  const canvasSizeRef = useRef({ width: 0, height: 0 });

  // Regenerate terrain bitmap when world/z-level or colors change
  useEffect(() => {
    const update = () => {
      const { world, currentZLevel } = useGameStore.getState();
      if (!world) return;
      const level = world.levels.get(currentZLevel);
      if (!level) return;

      const colors = useGameColorStore.getState().resolved;
      const imageData = generateTerrainImage(level, colors);
      worldSizeRef.current = { width: level.width, height: level.height };

      createImageBitmap(imageData).then((bitmap) => {
        bitmapRef.current?.close();
        bitmapRef.current = bitmap;
        dirtyRef.current = true;

        // Re-fit if canvas is available
        const { width, height } = canvasSizeRef.current;
        if (width > 0 && height > 0) {
          const fit = fitToCanvas(level.width, level.height, width, height);
          if (fit) {
            zoomRef.current = fit.zoom;
            panRef.current = { x: fit.x, y: fit.y };
            dirtyRef.current = true;
          }
        }
      });
    };

    update();

    // Subscribe to world/z-level changes
    let prevWorld = useGameStore.getState().world;
    let prevZ = useGameStore.getState().currentZLevel;
    const unsubGame = useGameStore.subscribe((state) => {
      if (state.world !== prevWorld || state.currentZLevel !== prevZ) {
        prevWorld = state.world;
        prevZ = state.currentZLevel;
        update();
      }
    });

    // Subscribe to color changes to regenerate terrain image
    const unsubColors = useGameColorStore.subscribe(() => {
      update();
    });

    return () => {
      unsubGame();
      unsubColors();
      bitmapRef.current?.close();
      bitmapRef.current = null;
    };
  }, []);

  // Setup canvas, rAF loop, ResizeObserver, and event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // --- Resize Observer ---
    // Only flag that resize is needed — actual canvas resize happens in the rAF
    // loop right before render, so the canvas is never blank between frames.
    let pendingResize: { width: number; height: number } | null = null;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width === 0 || height === 0) return;
      pendingResize = { width, height };
    });
    observer.observe(container);

    // --- Render function ---
    const render = () => {
      const dpr = window.devicePixelRatio;
      const w = canvasSizeRef.current.width;
      const h = canvasSizeRef.current.height;
      if (w === 0 || h === 0) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const renderColors = useGameColorStore.getState().resolved;
      ctx.fillStyle = renderColors.minimap.background;
      ctx.fillRect(0, 0, w, h);

      // Apply mini-map transform
      ctx.save();
      ctx.translate(panRef.current.x, panRef.current.y);
      ctx.scale(zoomRef.current, zoomRef.current);
      ctx.imageSmoothingEnabled = false;

      // Draw cached terrain bitmap
      if (bitmapRef.current) {
        ctx.drawImage(bitmapRef.current, 0, 0);
      }

      // Draw characters
      const { simulation, currentZLevel } = useGameStore.getState();
      const dotSize = Math.max(1, 3 / zoomRef.current);
      ctx.fillStyle = renderColors.characters.minimapDot;
      for (const character of simulation.characters.values()) {
        if (character.position.z === currentZLevel) {
          const tx = character.position.x + character.visualOffset.x;
          const ty = character.position.y + character.visualOffset.y;
          ctx.fillRect(tx - dotSize / 2, ty - dotSize / 2, dotSize, dotSize);
        }
      }

      // Draw viewport rectangle
      const viewport = viewportStore.getViewport();
      if (viewport) {
        const bounds = viewport.getVisibleBounds();
        const tileLeft = bounds.left / CELL_SIZE;
        const tileTop = bounds.top / CELL_SIZE;
        const tileRight = bounds.right / CELL_SIZE;
        const tileBottom = bounds.bottom / CELL_SIZE;

        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = renderColors.minimap.viewportRect;
        ctx.lineWidth = 2 / zoomRef.current;
        ctx.strokeRect(
          tileLeft,
          tileTop,
          tileRight - tileLeft,
          tileBottom - tileTop,
        );
        ctx.globalAlpha = 1.0;
      }

      ctx.restore();
    };

    // --- rAF loop with dirty-flag gating ---
    let rafId: number;
    const loop = () => {
      // Apply pending resize right before render (avoids blank-frame flicker)
      if (pendingResize) {
        const { width, height } = pendingResize;
        pendingResize = null;
        const dpr = window.devicePixelRatio;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        canvasSizeRef.current = { width, height };

        const fit = fitToCanvas(
          worldSizeRef.current.width,
          worldSizeRef.current.height,
          width,
          height,
        );
        if (fit) {
          zoomRef.current = fit.zoom;
          panRef.current = { x: fit.x, y: fit.y };
        }
      }

      // Check if viewport bounds changed
      const viewport = viewportStore.getViewport();
      if (viewport) {
        const bounds = viewport.getVisibleBounds();
        const prev = prevBoundsRef.current;
        if (
          bounds.left !== prev.left ||
          bounds.top !== prev.top ||
          bounds.right !== prev.right ||
          bounds.bottom !== prev.bottom
        ) {
          prevBoundsRef.current = { ...bounds };
          dirtyRef.current = true;
        }
      }

      // Always redraw — characters move every frame and the render is cheap
      render();
      dirtyRef.current = false;

      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    // --- Wheel zoom ---
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Check if mouse is over the viewport rectangle (the "lens")
      const viewport = viewportStore.getViewport();
      if (viewport) {
        const { tileX, tileY } = canvasToTile(
          mouseX,
          mouseY,
          panRef.current,
          zoomRef.current,
        );
        const bounds = viewport.getVisibleBounds();
        const tileLeft = bounds.left / CELL_SIZE;
        const tileTop = bounds.top / CELL_SIZE;
        const tileRight = bounds.right / CELL_SIZE;
        const tileBottom = bounds.bottom / CELL_SIZE;

        if (
          tileX >= tileLeft &&
          tileX <= tileRight &&
          tileY >= tileTop &&
          tileY <= tileBottom
        ) {
          // Mouse is over the lens — zoom the main world viewport
          const currentZoom = viewportStore.getZoom();
          const direction = e.deltaY < 0 ? 1 : -1;
          const newZoom = currentZoom * (1 + direction * 0.1);
          viewportStore.setZoom(Math.max(0.1, Math.min(4, newZoom)));
          return;
        }
      }

      // Mouse is outside the lens — zoom the mini-map itself
      const worldXBefore = (mouseX - panRef.current.x) / zoomRef.current;
      const worldYBefore = (mouseY - panRef.current.y) / zoomRef.current;

      const direction = e.deltaY < 0 ? 1 : -1;
      const factor = 1 + direction * ZOOM_SPEED;
      zoomRef.current = Math.max(
        MIN_ZOOM,
        Math.min(MAX_ZOOM, zoomRef.current * factor),
      );

      // Adjust pan so world point stays under cursor
      panRef.current.x = mouseX - worldXBefore * zoomRef.current;
      panRef.current.y = mouseY - worldYBefore * zoomRef.current;

      dirtyRef.current = true;
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });

    // --- Click/drag to pan main viewport ---
    const panMainViewport = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;
      const { tileX, tileY } = canvasToTile(
        canvasX,
        canvasY,
        panRef.current,
        zoomRef.current,
      );
      viewportStore.panTo(tileX * CELL_SIZE, tileY * CELL_SIZE);
    };

    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      panMainViewport(e);
    };
    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        panMainViewport(e);
      }
    };
    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}

// =============================================================================
// WIDGET DEFINITION
// =============================================================================

function MiniMapWidget(_props: WidgetComponentProps) {
  const world = useGameStore((s) => s.world);
  if (!world) {
    return (
      <div className="flex items-center justify-center w-full h-full text-muted-foreground text-sm">
        No world loaded
      </div>
    );
  }
  return <MiniMap />;
}

export const miniMapWidget: WidgetDefinition = {
  id: "mini-map",
  label: "Mini-Map",
  icon: MapIcon,
  component: MiniMapWidget,
  defaultSlot: "right-top",
  size: "normal",
};
