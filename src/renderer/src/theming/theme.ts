import type { StructureType, TerrainType } from "../world/types";

// =============================================================================
// COLOR SCALE (hex-string variant for theme definitions)
// =============================================================================

/** Color scale using hex strings — the canonical format stored in themes. */
export interface ColorScaleHex {
  type: "gradient" | "discrete" | "diverging";
  stops: { value: number; color: string }[];
  midpoint?: number;
}

// =============================================================================
// GAME COLORS — all in-game colors in "#RRGGBB" hex format
// =============================================================================

export interface GameColors {
  world: {
    background: string;
    gridLine: string;
    worldBoundary: string;
    infoText: string;
    itemFallbackDot: string;
  };
  selection: {
    highlight: string;
    hoverFill: string;
    pathLine: string;
  };
  characters: {
    colonistPalette: string[];
    colonistFallback: string;
    minimapDot: string;
  };
  jobs: {
    chop: string;
    mine: string;
    move: string;
    defaultJob: string;
    indicatorBorder: string;
  };
  progressBar: {
    background: string;
    fill: string;
    border: string;
  };
  structures: Record<StructureType, string>;
  minimap: {
    background: string;
    viewportRect: string;
  } & Record<TerrainType, string>;
  heatmaps: {
    temperature: ColorScaleHex;
    moisture: ColorScaleHex;
    movementCost: ColorScaleHex;
  };
  palette: PaletteColors;
}

/** All 31 opaque colors from the universal sprite palette (palette.txt). */
export interface PaletteColors {
  // Basics
  black: string;
  // Grays
  charcoal: string;
  darkGray: string;
  gray: string;
  mediumGray: string;
  lightGray: string;
  silver: string;
  // Whites
  white: string;
  // Browns
  darkBark: string;
  bark: string;
  dirt: string;
  tan: string;
  // Greens
  deepForest: string;
  forest: string;
  green: string;
  lime: string;
  // Teals
  seaGreen: string;
  mediumSea: string;
  // Blues
  deepOcean: string;
  ocean: string;
  water: string;
  sky: string;
  // Warm
  crimson: string;
  lava: string;
  orange: string;
  gold: string;
  sand: string;
  // Skin & Special
  lightSkin: string;
  mediumSkin: string;
  darkSkin: string;
  olive: string;
}

// =============================================================================
// COLONY THEME
// =============================================================================

export interface ColonyTheme {
  id: string;
  name: string;
  type: "light" | "dark";
  colors: UIColors;
  gameColors: GameColors;
}

export type UIColors = {
  // Base colors
  background: string;
  foreground: string;

  // Card colors
  card: string;
  cardForeground: string;

  // Popover colors
  popover: string;
  popoverForeground: string;

  // Primary colors
  primary: string;
  primaryForeground: string;

  // Secondary colors
  secondary: string;
  secondaryForeground: string;

  // Muted colors
  muted: string;
  mutedForeground: string;

  // Accent colors
  accent: string;
  accentForeground: string;

  // Destructive colors (replaces error)
  destructive: string;
  destructiveForeground: string;

  // Border and input colors
  border: string;
  input: string;
  ring: string;

  // Chart colors
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;

  // Log colors
  logWarn: string;

  // Sidebar colors
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
};
