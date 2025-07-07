// =============================================================================
// WORLD WITH CONTROL BARS
// =============================================================================

import { useCurrentZLevel, useWorld } from "../../game-state";
import World from "../pixi/World";
import { ControlBarSlot } from "./ControlBarSlot";

/**
 * Wrapper around World that adds floating control bars at the 4 corners
 */
export function WorldWithControlBars() {
  const world = useWorld();
  const zLevel = useCurrentZLevel();

  if (!world) {
    return null;
  }

  return (
    <div className="relative w-full h-full">
      {/* The Pixi.js World canvas */}
      <World world={world} zLevel={zLevel} />

      {/* Control bar overlays - positioned absolutely over the canvas */}
      <ControlBarSlot position="left-top" />
      <ControlBarSlot position="left-bottom" />
      <ControlBarSlot position="right-top" />
      <ControlBarSlot position="right-bottom" />
    </div>
  );
}
