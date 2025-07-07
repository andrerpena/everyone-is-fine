/**
 * Single source of truth for all registry IDs.
 * TypeScript types AND Zod schemas are derived from these.
 *
 * To add a new widget/status bar/control bar/command:
 * 1. Add the ID to the appropriate array below
 * 2. Create the definition file
 * 3. Register it in the appropriate register-*.ts file
 *
 * NOTE: COMMAND_IDS must be kept in sync with the command definitions
 * registered in ColonyContext.tsx. A dev-time warning will fire if they diverge.
 */

export const WIDGET_IDS = [
  "world",
  "characters",
  "layers",
  "logs",
  "performance",
  "settings",
  "tile-inspector",
  "mini-map",
] as const;

export const STATUS_BAR_IDS = [
  "version",
  "theme",
  "run-command",
  "fps",
] as const;

export const CONTROL_BAR_IDS = ["time-control", "zoom-control"] as const;

/**
 * All executable command IDs.
 * Keep in sync with command definitions registered in ColonyContext.tsx.
 */
export const COMMAND_IDS = [
  "workbench.runCommand",
  "workbench.setTheme",
  "character.select",
  "character.moveTo",
  "character.focus",
  "world.setZoom",
  "layer.toggleVisibility",
  "layer.setVisibility",
  "widget.openInModal",
  "widget.bringToFront",
  "widget.setActiveTab",
] as const;

/** Union of all command ID literal types */
export type CommandId = (typeof COMMAND_IDS)[number];

// Derived TypeScript types
export type WidgetId = (typeof WIDGET_IDS)[number];
export type StatusBarId = (typeof STATUS_BAR_IDS)[number];
export type ControlBarId = (typeof CONTROL_BAR_IDS)[number];
