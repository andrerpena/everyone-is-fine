import { useConfigStore } from "./config-store";
import type { ConfigRecord, ConfigValue } from "./types";

/**
 * Hook to get a single configuration value.
 * Re-renders only when this specific value changes.
 */
export function useConfigValue<T extends ConfigValue>(key: string): T {
  return useConfigStore((state) => state.computed[key] as T);
}

/**
 * Hook to get the config setter.
 * Stable reference, won't cause re-renders.
 */
export function useSetConfig(): (key: string, value: ConfigValue) => void {
  return useConfigStore((state) => state.set);
}

/**
 * Hook for full config access (overrides JSON editor scenario).
 */
export function useConfigOverrides(): {
  overrides: ConfigRecord;
  setOverrides: (overrides: ConfigRecord) => void;
  resetOverrides: () => void;
  save: () => Promise<void>;
} {
  return useConfigStore((state) => ({
    overrides: state.overrides,
    setOverrides: state.setOverrides,
    resetOverrides: state.resetOverrides,
    save: state.save,
  }));
}
