// =============================================================================
// CONTROL BAR TYPE DEFINITIONS
// =============================================================================

import type { ControlBarId } from "@renderer/config/registry-ids";
import type { ComponentType } from "react";

export type { ControlBarId };

/**
 * Positions where control bars can be placed
 */
export type ControlBarPosition =
  | "left-top"
  | "left-bottom"
  | "right-top"
  | "right-bottom";

/**
 * Props passed to control bar components
 */
export interface ControlBarProps {
  barId: string;
  position: ControlBarPosition;
}

/**
 * Definition for a control bar (position is set in layout config, not here)
 */
export interface ControlBarDefinition {
  /** Unique identifier for the control bar */
  id: ControlBarId;
  /** The React component to render */
  component: ComponentType<ControlBarProps>;
}

/**
 * Layout configuration for control bar positions
 */
export interface ControlBarLayoutConfig {
  slots: Record<ControlBarPosition, ControlBarId[]>;
}
