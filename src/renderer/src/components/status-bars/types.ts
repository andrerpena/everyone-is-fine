// =============================================================================
// STATUS BAR TYPE DEFINITIONS
// =============================================================================

import type { StatusBarId } from "@renderer/config/registry-ids";
import type { ComponentType } from "react";

export type { StatusBarId };

/**
 * Alignment for status bar items within the container
 */
export type StatusBarAlignment = "left" | "right";

/**
 * Props passed to status bar item components
 */
export interface StatusBarItemProps {
  /** The item's unique ID */
  itemId: string;
}

/**
 * Definition for a status bar item
 */
export interface StatusBarItemDefinition {
  /** Unique identifier for the status bar item (dash-case, e.g., "version") */
  id: StatusBarId;
  /** The React component to render */
  component: ComponentType<StatusBarItemProps>;
  /** Alignment within the status bar (default: "left") */
  alignment?: StatusBarAlignment;
  /**
   * Priority for ordering (lower = renders first within alignment group)
   * Default: 100
   */
  priority?: number;
}
