import type { Tile } from "../world/types";

// =============================================================================
// LAYER CATEGORIES AND TYPES
// =============================================================================

/** Layer categories for organization */
export type LayerCategory = "visualization" | "feature";

/** Layer types for discriminated unions */
export type LayerType = "heatmap" | "feature";

// =============================================================================
// COLOR SCALE TYPES
// =============================================================================

/** Color scale types */
export type ColorScaleType = "gradient" | "discrete" | "diverging";

/** Color stop for gradient definition */
export interface ColorStop {
  /** Position in the scale (0-1) */
  value: number;
  /** Hex color (e.g., 0xff0000) */
  color: number;
}

/** Color scale configuration */
export interface ColorScale {
  type: ColorScaleType;
  stops: ColorStop[];
  /** For diverging scales, the center value */
  midpoint?: number;
}

// =============================================================================
// LAYER DEFINITIONS
// =============================================================================

/** Base layer definition shared by all layers */
interface BaseLayerDefinition {
  /** Unique identifier (dash-case) */
  id: string;
  /** Display name for UI */
  name: string;
  /** Category for grouping */
  category: LayerCategory;
  /** Description for tooltips */
  description?: string;
  /** Default enabled state */
  defaultEnabled: boolean;
  /** Render order (higher = on top) */
  zIndex: number;
}

/** Heat map layer definition for data visualization overlays */
export interface HeatMapLayerDefinition extends BaseLayerDefinition {
  type: "heatmap";
  /** Extract the value (0-1) from a tile for this layer */
  getValue: (tile: Tile) => number;
  /** Color scale configuration */
  colorScale: ColorScale;
  /** Overlay opacity (0-1) */
  opacity: number;
  /** Optional: min/max value range for normalization */
  valueRange?: { min: number; max: number };
  /** Label format for the value (e.g., "{value}%" or "{value}C") */
  labelFormat?: string;
}

/** Feature layer definition for toggling visibility of world elements */
export interface FeatureLayerDefinition extends BaseLayerDefinition {
  type: "feature";
  /** Filter function to determine which tiles this layer affects */
  filter: (tile: Tile) => boolean;
  /** Whether this layer uses custom render logic (e.g., characters) */
  customRender?: boolean;
}

/** Union type for all layer definitions */
export type LayerDefinition = HeatMapLayerDefinition | FeatureLayerDefinition;

// =============================================================================
// LAYER STATE
// =============================================================================

/** Layer visibility map (for the store) */
export type LayerVisibilityMap = Map<string, boolean>;

/** Row type for DataGrid display */
export interface LayerRow {
  id: string;
  name: string;
  category: LayerCategory;
  type: LayerType;
  enabled: boolean;
}
