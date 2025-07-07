// =============================================================================
// ZOOM CONTROL BAR
// =============================================================================

import { Minus, Plus, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { viewportStore } from "../../../lib/viewport-simple/viewportStore";
import type { ControlBarDefinition, ControlBarProps } from "../types";

// =============================================================================
// ZOOM CONTROL BAR COMPONENT
// =============================================================================

function ZoomControlBarComponent(_props: ControlBarProps) {
  const [zoom, setZoom] = useState(1);

  // Sync zoom state with viewport
  useEffect(() => {
    const interval = setInterval(() => {
      const currentZoom = viewportStore.getZoom();
      setZoom(currentZoom);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleZoomIn = useCallback(() => {
    const currentZoom = viewportStore.getZoom();
    viewportStore.setZoom(Math.min(currentZoom * 1.25, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    const currentZoom = viewportStore.getZoom();
    viewportStore.setZoom(Math.max(currentZoom / 1.25, 0.25));
  }, []);

  const handleZoomReset = useCallback(() => {
    viewportStore.setZoom(1);
  }, []);

  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-background/70 backdrop-blur-sm border border-border/50 shadow-lg">
      {/* Zoom Out */}
      <button
        type="button"
        onClick={handleZoomOut}
        className="flex items-center justify-center w-7 h-7 rounded-md transition-colors bg-muted/50 hover:bg-muted text-muted-foreground"
        title="Zoom Out"
      >
        <Minus size={14} />
      </button>

      {/* Zoom Level Display */}
      <span className="min-w-[3.5rem] text-center text-xs font-mono text-foreground/80">
        {zoomPercent}%
      </span>

      {/* Zoom In */}
      <button
        type="button"
        onClick={handleZoomIn}
        className="flex items-center justify-center w-7 h-7 rounded-md transition-colors bg-muted/50 hover:bg-muted text-muted-foreground"
        title="Zoom In"
      >
        <Plus size={14} />
      </button>

      {/* Zoom Reset */}
      <button
        type="button"
        onClick={handleZoomReset}
        className="flex items-center justify-center w-7 h-7 rounded-md transition-colors bg-muted/50 hover:bg-muted text-muted-foreground"
        title="Reset Zoom (100%)"
      >
        <RotateCcw size={14} />
      </button>
    </div>
  );
}

// =============================================================================
// DEFINITION EXPORT
// =============================================================================

export const zoomControlBar: ControlBarDefinition = {
  id: "zoom-control",
  component: ZoomControlBarComponent,
};
