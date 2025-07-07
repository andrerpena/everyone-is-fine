// =============================================================================
// CONTROL BAR REGISTRATION
// =============================================================================

import { controlBarRegistry } from "./control-bar-registry";
import { timeControlBar, zoomControlBar } from "./definitions";

/**
 * Register all built-in control bars.
 * Call this during app initialization.
 * Note: Default layout is now defined in config/defaults.ts
 */
export function registerBuiltInControlBars(): void {
  controlBarRegistry.register(timeControlBar);
  controlBarRegistry.register(zoomControlBar);
}
