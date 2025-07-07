import {
  charactersWidget,
  layersWidget,
  logsWidget,
  miniMapWidget,
  performanceWidget,
  settingsWidget,
  tileInspectorWidget,
  worldWidget,
} from "./definitions";
import { widgetRegistry } from "./widget-registry";

/**
 * Register all built-in widgets.
 * Call this during app initialization.
 * Note: Default layout is now defined in config/defaults.ts
 */
export function registerBuiltInWidgets(): void {
  widgetRegistry.register(worldWidget);
  widgetRegistry.register(charactersWidget);
  widgetRegistry.register(layersWidget);
  widgetRegistry.register(logsWidget);
  widgetRegistry.register(performanceWidget);
  widgetRegistry.register(settingsWidget);
  widgetRegistry.register(tileInspectorWidget);
  widgetRegistry.register(miniMapWidget);
}
