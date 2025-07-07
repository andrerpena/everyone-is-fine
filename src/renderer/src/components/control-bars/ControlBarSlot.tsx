// =============================================================================
// CONTROL BAR SLOT COMPONENT
// =============================================================================

import { useControlBarLayoutConfig } from "@renderer/config";
import { controlBarRegistry } from "./control-bar-registry";
import type { ControlBarPosition } from "./types";

interface ControlBarSlotProps {
  position: ControlBarPosition;
}

const positionClasses: Record<ControlBarPosition, string> = {
  "left-top": "top-2 left-2",
  "left-bottom": "bottom-2 left-2",
  "right-top": "top-2 right-2",
  "right-bottom": "bottom-2 right-2",
};

/**
 * Container for control bars at a specific position.
 * Renders all registered control bars for the given position in a horizontal row.
 * Subscribes to config to re-render when control bar config changes.
 */
export function ControlBarSlot({ position }: ControlBarSlotProps) {
  // Subscribe to config changes to trigger re-renders
  useControlBarLayoutConfig();

  const bars = controlBarRegistry.getByPosition(position);

  if (bars.length === 0) {
    return null;
  }

  return (
    <div
      className={`absolute ${positionClasses[position]} flex flex-row gap-2 pointer-events-none z-10`}
    >
      {bars.map((bar) => (
        <div key={bar.id} className="pointer-events-auto">
          <bar.component barId={bar.id} position={position} />
        </div>
      ))}
    </div>
  );
}
