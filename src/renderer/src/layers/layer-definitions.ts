import { getResolvedScale, normalizeValue } from "./color-scales";
import { layerRegistry } from "./layer-registry";
import type { FeatureLayerDefinition, HeatMapLayerDefinition } from "./types";

// =============================================================================
// HEAT MAP LAYERS (Visualization)
// =============================================================================

export const moistureLayer: HeatMapLayerDefinition = {
  id: "moisture",
  name: "Moisture",
  category: "visualization",
  type: "heatmap",
  description: "Shows moisture levels across the terrain",
  defaultEnabled: false,
  zIndex: 100,
  getValue: (tile) => tile.terrain.moisture,
  colorScale: getResolvedScale("moisture"),
  opacity: 0.5,
  labelFormat: "{value}%",
};

export const temperatureLayer: HeatMapLayerDefinition = {
  id: "temperature",
  name: "Temperature",
  category: "visualization",
  type: "heatmap",
  description: "Shows temperature distribution",
  defaultEnabled: false,
  zIndex: 101,
  getValue: (tile) => normalizeValue(tile.terrain.temperature, -20, 50),
  colorScale: getResolvedScale("temperature"),
  opacity: 0.5,
  valueRange: { min: -20, max: 50 },
  labelFormat: "{value}C",
};

export const movementCostLayer: HeatMapLayerDefinition = {
  id: "movement-cost",
  name: "Movement Cost",
  category: "visualization",
  type: "heatmap",
  description: "Shows pathfinding movement costs",
  defaultEnabled: false,
  zIndex: 102,
  getValue: (tile) => {
    if (!tile.pathfinding.isPassable) return 1; // Max value for impassable
    // Normalize movement cost (1 = normal, higher = harder)
    return normalizeValue(tile.pathfinding.movementCost, 1, 10);
  },
  colorScale: getResolvedScale("movementCost"),
  opacity: 0.5,
  valueRange: { min: 1, max: 10 },
  labelFormat: "Cost: {value}",
};

// =============================================================================
// FEATURE LAYERS
// =============================================================================

export const treesLayer: FeatureLayerDefinition = {
  id: "trees",
  name: "Trees",
  category: "feature",
  type: "feature",
  description: "Toggle visibility of trees and vegetation",
  defaultEnabled: true,
  zIndex: 50,
  filter: (tile) =>
    tile.structure?.type === "tree_oak" ||
    tile.structure?.type === "tree_pine" ||
    tile.structure?.type === "bush",
};

export const structuresLayer: FeatureLayerDefinition = {
  id: "structures",
  name: "Structures",
  category: "feature",
  type: "feature",
  description: "Toggle visibility of walls, doors, and buildings",
  defaultEnabled: true,
  zIndex: 51,
  filter: (tile) =>
    tile.structure !== null &&
    tile.structure.type !== "none" &&
    !["tree_oak", "tree_pine", "bush", "boulder"].includes(tile.structure.type),
};

export const itemsLayer: FeatureLayerDefinition = {
  id: "items",
  name: "Items",
  category: "feature",
  type: "feature",
  description: "Toggle visibility of items on the ground",
  defaultEnabled: true,
  zIndex: 52,
  filter: (tile) => tile.items.length > 0,
};

export const charactersLayer: FeatureLayerDefinition = {
  id: "characters",
  name: "Characters",
  category: "feature",
  type: "feature",
  description: "Toggle visibility of characters and colonists",
  defaultEnabled: true,
  zIndex: 200, // Highest - always on top
  filter: () => true, // Characters are rendered separately
  customRender: true,
};

// =============================================================================
// REGISTRATION
// =============================================================================

/**
 * Register all built-in layers.
 * Call this during app initialization.
 */
export function registerBuiltInLayers(): void {
  // Visualization layers (heat maps)
  layerRegistry.register(moistureLayer);
  layerRegistry.register(temperatureLayer);
  layerRegistry.register(movementCostLayer);

  // Feature layers
  layerRegistry.register(treesLayer);
  layerRegistry.register(structuresLayer);
  layerRegistry.register(itemsLayer);
  layerRegistry.register(charactersLayer);
}
