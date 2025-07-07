// =============================================================================
// STATUS BAR REGISTRY
// =============================================================================

import {
  type StatusBarLayoutConfigValue,
  useConfigStore,
} from "@renderer/config";
import { logger } from "@renderer/lib/logger";
import type { StatusBarAlignment, StatusBarItemDefinition } from "./types";

/**
 * Registry for managing status bar item definitions
 */
class StatusBarRegistryImpl {
  private items = new Map<string, StatusBarItemDefinition>();

  /**
   * Register a status bar item definition
   */
  register(definition: StatusBarItemDefinition): void {
    if (this.items.has(definition.id)) {
      logger.warn(
        `Status bar "${definition.id}" already registered, overwriting`,
        ["statusbar"],
      );
    } else {
      logger.debug(`Registered status bar: ${definition.id}`, ["statusbar"]);
    }
    this.items.set(definition.id, definition);
  }

  /**
   * Get a status bar item definition by ID
   */
  get(id: string): StatusBarItemDefinition | undefined {
    return this.items.get(id);
  }

  /**
   * Check if a status bar item is registered
   */
  has(id: string): boolean {
    return this.items.has(id);
  }

  /**
   * Get all status bar items for a specific alignment (from config).
   * Returns items in the order specified in config.
   */
  getByAlignment(alignment: StatusBarAlignment): StatusBarItemDefinition[] {
    const config = useConfigStore.getState().computed[
      "layout.statusBars"
    ] as unknown as StatusBarLayoutConfigValue | undefined;

    const itemIds = config?.[alignment] ?? [];
    const items: StatusBarItemDefinition[] = [];

    for (const id of itemIds) {
      const item = this.items.get(id);
      if (item) {
        items.push(item);
      }
    }

    return items;
  }

  /**
   * Get all registered status bar items
   */
  getAll(): StatusBarItemDefinition[] {
    return Array.from(this.items.values());
  }

  /**
   * Clear all registrations (useful for testing)
   */
  clear(): void {
    this.items.clear();
  }
}

/**
 * Global status bar registry singleton
 */
export const statusBarRegistry = new StatusBarRegistryImpl();
