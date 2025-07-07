/**
 * Layout configuration types for config values.
 * These types represent the JSON structure stored in the config system.
 */

import type { ControlBarPosition } from "../components/control-bars/types";
import type { StatusBarAlignment } from "../components/status-bars/types";
import type { WidgetId, WidgetSlotId } from "../components/widgets/types";

/**
 * Widget layout config value stored in config.
 * Maps slot IDs to arrays of widget IDs.
 */
export type WidgetLayoutConfigValue = Record<WidgetSlotId, WidgetId[]>;

/**
 * Status bar layout config value stored in config.
 * Maps alignment to arrays of status bar item IDs (in order).
 */
export type StatusBarLayoutConfigValue = Record<StatusBarAlignment, string[]>;

/**
 * Control bar layout config value stored in config.
 * Maps position IDs to arrays of control bar IDs.
 */
export type ControlBarLayoutConfigValue = Record<ControlBarPosition, string[]>;
