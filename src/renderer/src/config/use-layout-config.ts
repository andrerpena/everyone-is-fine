/**
 * Hooks for reading layout configurations from the config store.
 */

import { useConfigStore } from "./config-store";
import type {
  ControlBarLayoutConfigValue,
  StatusBarLayoutConfigValue,
  WidgetLayoutConfigValue,
} from "./layout-types";

/**
 * Hook to get widget layout config.
 * Returns computed value (defaults merged with overrides).
 */
export function useWidgetLayoutConfig(): WidgetLayoutConfigValue {
  return useConfigStore(
    (state) =>
      state.computed["layout.widgets"] as unknown as WidgetLayoutConfigValue,
  );
}

/**
 * Hook to get status bar layout config.
 */
export function useStatusBarLayoutConfig(): StatusBarLayoutConfigValue {
  return useConfigStore(
    (state) =>
      state.computed[
        "layout.statusBars"
      ] as unknown as StatusBarLayoutConfigValue,
  );
}

/**
 * Hook to get control bar layout config.
 */
export function useControlBarLayoutConfig(): ControlBarLayoutConfigValue {
  return useConfigStore(
    (state) =>
      state.computed[
        "layout.controlBars"
      ] as unknown as ControlBarLayoutConfigValue,
  );
}
