import type {
  HeatMapLayerDefinition,
  LayerCategory,
  LayerDefinition,
} from "./types";

/**
 * Registry for managing layer definitions.
 * Layers must be registered before they can be used.
 */
class LayerRegistryImpl {
  private layers = new Map<string, LayerDefinition>();
  private orderedIds: string[] = [];

  /**
   * Register a layer definition.
   */
  register(definition: LayerDefinition): void {
    if (this.layers.has(definition.id)) {
      console.warn(
        `Layer "${definition.id}" is already registered, overwriting.`,
      );
      // Remove from ordered list to re-add at correct position
      this.orderedIds = this.orderedIds.filter((id) => id !== definition.id);
    }
    this.layers.set(definition.id, definition);

    // Insert maintaining zIndex order
    const insertIdx = this.orderedIds.findIndex((id) => {
      const existing = this.layers.get(id);
      return existing && existing.zIndex > definition.zIndex;
    });
    if (insertIdx === -1) {
      this.orderedIds.push(definition.id);
    } else {
      this.orderedIds.splice(insertIdx, 0, definition.id);
    }
  }

  /**
   * Get a layer definition by ID.
   */
  get(id: string): LayerDefinition | undefined {
    return this.layers.get(id);
  }

  /**
   * Check if a layer is registered.
   */
  has(id: string): boolean {
    return this.layers.has(id);
  }

  /**
   * Get all layers ordered by zIndex.
   */
  getAll(): LayerDefinition[] {
    return this.orderedIds
      .map((id) => this.layers.get(id))
      .filter((layer): layer is LayerDefinition => layer !== undefined);
  }

  /**
   * Get layers by category.
   */
  getByCategory(category: LayerCategory): LayerDefinition[] {
    return this.getAll().filter((layer) => layer.category === category);
  }

  /**
   * Get heat map layers.
   */
  getHeatMapLayers(): HeatMapLayerDefinition[] {
    return this.getAll().filter(
      (layer): layer is HeatMapLayerDefinition => layer.type === "heatmap",
    );
  }

  /**
   * Get default visibility state for all layers.
   */
  getDefaultVisibility(): Map<string, boolean> {
    const visibility = new Map<string, boolean>();
    for (const layer of this.getAll()) {
      visibility.set(layer.id, layer.defaultEnabled);
    }
    return visibility;
  }

  /**
   * Clear all registrations (useful for testing).
   */
  clear(): void {
    this.layers.clear();
    this.orderedIds = [];
  }
}

// Singleton instance
export const layerRegistry = new LayerRegistryImpl();
