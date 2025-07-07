import type { ConfigRecord, ConfigSchema } from "./types";

/**
 * Configuration schema with type information and defaults.
 * This serves as the source of truth for all configuration properties.
 */
export const CONFIG_SCHEMA: ConfigSchema = {
  "pixi.maxFramerate": {
    type: "number",
    default: 60,
    description: "Maximum framerate for the Pixi.js renderer",
    minimum: 30,
    maximum: 144,
  },
  "layout.widgets": {
    type: "object",
    default: {
      "left-top": [],
      "left-bottom": [],
      center: ["world", "settings"],
      "center-bottom": ["logs"],
      "right-top": ["mini-map", "tile-inspector"],
      "right-bottom": ["layers", "characters", "performance"],
    },
    description: "Widget slot assignments",
  },
  "layout.statusBars": {
    type: "object",
    default: {
      left: ["version", "run-command", "theme"],
      right: ["fps"],
    },
    description: "Status bar alignment assignments",
  },
  "layout.controlBars": {
    type: "object",
    default: {
      "left-top": [],
      "left-bottom": [],
      "right-top": ["time-control", "zoom-control"],
      "right-bottom": [],
    },
    description: "Control bar slot assignments",
  },
  theme: {
    type: "object",
    default: {},
    description:
      'Theme color overrides: game colors as dot-path keys (e.g. "world.background": "#0a0a1e") and UI colors with "ui." prefix (e.g. "ui.background": "oklch(0.2 0 0)")',
  },
  keybindings: {
    type: "array",
    default: [{ key: ["meta+k", "ctrl+k"], command: "workbench.runCommand" }],
    description:
      "Keybinding definitions. Each entry maps a key combination to a command. Use an array for platform alternatives.",
  },
};

/**
 * Extract default values from schema.
 * Returns a ConfigRecord with all default values.
 */
export function getDefaultConfig(): ConfigRecord {
  const defaults: ConfigRecord = {};
  for (const [key, schema] of Object.entries(CONFIG_SCHEMA)) {
    defaults[key] = schema.default;
  }
  return defaults;
}

/**
 * The default configuration values.
 */
export const DEFAULT_CONFIG = getDefaultConfig();
