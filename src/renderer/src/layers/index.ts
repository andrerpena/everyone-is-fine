// Types

// Color scales
export {
  getColorFromScale,
  getResolvedScale,
  type HeatmapScaleId,
  lerpColor,
  normalizeValue,
} from "./color-scales";
// Layer definitions
export {
  charactersLayer,
  itemsLayer,
  moistureLayer,
  movementCostLayer,
  registerBuiltInLayers,
  structuresLayer,
  temperatureLayer,
  treesLayer,
} from "./layer-definitions";

// Registry
export { layerRegistry } from "./layer-registry";

// Store
export {
  useEnabledLayers,
  useLayerStore,
  useLayerVisibility,
  useLayerVisibilityMap,
} from "./layer-store";
export type {
  ColorScale,
  ColorScaleType,
  ColorStop,
  FeatureLayerDefinition,
  HeatMapLayerDefinition,
  LayerCategory,
  LayerDefinition,
  LayerRow,
  LayerType,
  LayerVisibilityMap,
} from "./types";
