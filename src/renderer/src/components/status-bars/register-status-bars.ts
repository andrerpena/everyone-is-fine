// =============================================================================
// STATUS BAR REGISTRATION
// =============================================================================

import {
  fpsStatusBar,
  runCommandStatusBar,
  themeStatusBar,
  versionStatusBar,
} from "./definitions";
import { statusBarRegistry } from "./status-bar-registry";

/**
 * Register all built-in status bar items.
 * Call this during app initialization.
 */
export function registerBuiltInStatusBars(): void {
  statusBarRegistry.register(versionStatusBar);
  statusBarRegistry.register(themeStatusBar);
  statusBarRegistry.register(runCommandStatusBar);
  statusBarRegistry.register(fpsStatusBar);
}
