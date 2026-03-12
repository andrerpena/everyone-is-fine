import {
  charactersWidget,
  colonistInfoWidget,
  layersWidget,
  logsWidget,
  miniMapWidget,
  performanceWidget,
  settingsWidget,
  tileInspectorWidget,
  workPrioritiesWidget,
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
  widgetRegistry.register(colonistInfoWidget);
  widgetRegistry.register(layersWidget);
  widgetRegistry.register(logsWidget);
  widgetRegistry.register(performanceWidget);
  widgetRegistry.register(settingsWidget);
  widgetRegistry.register(tileInspectorWidget);
  widgetRegistry.register(miniMapWidget);
  widgetRegistry.register(workPrioritiesWidget);
}
