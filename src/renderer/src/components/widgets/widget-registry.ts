import { logger } from "../../lib/logger";
import type { WidgetDefinition, WidgetId } from "./types";

/**
 * Registry for managing widget definitions.
 * Widgets must be registered before they can be assigned to slots.
 */
class WidgetRegistryImpl {
  private widgets = new Map<WidgetId, WidgetDefinition>();

  /**
   * Register a widget definition.
   */
  register(definition: WidgetDefinition): void {
    if (this.widgets.has(definition.id)) {
      logger.warn(
        `Widget "${definition.id}" is already registered, overwriting`,
        ["widget"],
      );
    } else {
      logger.debug(`Registered widget: ${definition.id}`, ["widget"]);
    }
    this.widgets.set(definition.id, definition);
  }

  /**
   * Get a widget definition by ID.
   * Accepts string for lookups from external sources.
   */
  get(id: string): WidgetDefinition | undefined {
    return this.widgets.get(id as WidgetId);
  }

  /**
   * Check if a widget exists.
   * Accepts string for lookups from external sources.
   */
  has(id: string): boolean {
    return this.widgets.has(id as WidgetId);
  }

  /**
   * Get all registered widgets.
   */
  getAll(): WidgetDefinition[] {
    return Array.from(this.widgets.values());
  }

  /**
   * Clear all registrations (useful for testing).
   */
  clear(): void {
    this.widgets.clear();
  }
}

// Singleton instance
export const widgetRegistry = new WidgetRegistryImpl();
