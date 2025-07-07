// Registry IDs (single source of truth for widget/status bar/control bar IDs)

// Zod Schema
export type { ConfigOverrides } from "./config-schema";
export { ConfigOverridesSchema, getConfigJsonSchema } from "./config-schema";
// Store
export { initializeConfig, useConfigStore } from "./config-store";
// Defaults
export { CONFIG_SCHEMA, DEFAULT_CONFIG, getDefaultConfig } from "./defaults";
export type {
  ControlBarLayoutConfigValue,
  StatusBarLayoutConfigValue,
  WidgetLayoutConfigValue,
} from "./layout-types";
export type {
  ControlBarId,
  StatusBarId,
  WidgetId,
} from "./registry-ids";
export {
  CONTROL_BAR_IDS,
  STATUS_BAR_IDS,
  WIDGET_IDS,
} from "./registry-ids";
export type {
  ConfigPropertySchema,
  ConfigRecord,
  ConfigSchema,
  ConfigValue,
} from "./types";

// Hooks
export { useConfigOverrides, useConfigValue, useSetConfig } from "./use-config";
export {
  useControlBarLayoutConfig,
  useStatusBarLayoutConfig,
  useWidgetLayoutConfig,
} from "./use-layout-config";
