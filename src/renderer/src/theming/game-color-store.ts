// =============================================================================
// GAME COLOR STORE
// =============================================================================
// Zustand store holding precomputed ResolvedGameColors.
// Renderers subscribe to this store and get ready-to-use numeric colors —
// no parseInt or conversion on every draw call.

import { create } from "zustand";
import type { ColorScale } from "../layers/types";
import type { StructureType, TerrainType } from "../world/types";
import { hexToPixi, hexToRGBA, resolveColorScale } from "./color-utils";
import { defaultGameColors } from "./default-game-colors";
import type { GameColors, PaletteColors } from "./theme";

// =============================================================================
// RESOLVED GAME COLORS — precomputed for each consumer format
// =============================================================================

export interface ResolvedGameColors {
  world: {
    background: number;
    gridLine: number;
    worldBoundary: number;
    infoText: number;
    itemFallbackDot: number;
  };
  selection: {
    highlight: number;
    hoverFill: number;
    pathLine: number;
  };
  characters: {
    colonistPalette: number[];
    colonistFallback: number;
    minimapDot: string;
  };
  jobs: {
    chop: number;
    mine: number;
    move: number;
    defaultJob: number;
    indicatorBorder: number;
    /** Lookup map built from chop/mine/move for renderer convenience */
    byType: Record<string, number>;
  };
  progressBar: {
    background: number;
    fill: number;
    border: number;
  };
  structures: {
    pixi: Record<StructureType, number>;
    rgba: Record<StructureType, [number, number, number, number]>;
  };
  minimap: {
    background: string;
    viewportRect: string;
    terrain: Record<TerrainType, [number, number, number, number]>;
  };
  heatmaps: {
    temperature: ColorScale;
    moisture: ColorScale;
    movementCost: ColorScale;
  };
  palette: {
    /** Base hex → override hex replacement map (only entries that differ from the baked PNG colors) */
    replacementMap: Map<string, string>;
    /** Full resolved palette: name → hex */
    colors: PaletteColors;
  };
}

// =============================================================================
// RESOLVE FUNCTION
// =============================================================================

function resolveGameColors(gc: GameColors): ResolvedGameColors {
  // Build structure pixi + rgba maps
  const structPixi = {} as Record<StructureType, number>;
  const structRgba = {} as Record<
    StructureType,
    [number, number, number, number]
  >;
  for (const [key, hex] of Object.entries(gc.structures)) {
    const st = key as StructureType;
    structPixi[st] = hexToPixi(hex);
    structRgba[st] = hexToRGBA(hex);
  }

  // Build minimap terrain rgba map
  const terrainRgba = {} as Record<
    TerrainType,
    [number, number, number, number]
  >;
  for (const [key, hex] of Object.entries(gc.minimap)) {
    if (key !== "background" && key !== "viewportRect") {
      terrainRgba[key as TerrainType] = hexToRGBA(hex);
    }
  }

  // Build job type lookup
  const jobChop = hexToPixi(gc.jobs.chop);
  const jobMine = hexToPixi(gc.jobs.mine);
  const jobMove = hexToPixi(gc.jobs.move);
  const byType: Record<string, number> = {
    chop: jobChop,
    mine: jobMine,
    move: jobMove,
  };

  // Build palette replacement map (base baked hex → overridden hex)
  const replacementMap = new Map<string, string>();
  for (const [name, currentHex] of Object.entries(gc.palette)) {
    const baseHex =
      defaultGameColors.palette[name as keyof PaletteColors]?.toLowerCase();
    if (baseHex && currentHex.toLowerCase() !== baseHex) {
      replacementMap.set(baseHex, currentHex.toLowerCase());
    }
  }

  return {
    world: {
      background: hexToPixi(gc.world.background),
      gridLine: hexToPixi(gc.world.gridLine),
      worldBoundary: hexToPixi(gc.world.worldBoundary),
      infoText: hexToPixi(gc.world.infoText),
      itemFallbackDot: hexToPixi(gc.world.itemFallbackDot),
    },
    selection: {
      highlight: hexToPixi(gc.selection.highlight),
      hoverFill: hexToPixi(gc.selection.hoverFill),
      pathLine: hexToPixi(gc.selection.pathLine),
    },
    characters: {
      colonistPalette: gc.characters.colonistPalette.map(hexToPixi),
      colonistFallback: hexToPixi(gc.characters.colonistFallback),
      minimapDot: gc.characters.minimapDot,
    },
    jobs: {
      chop: jobChop,
      mine: jobMine,
      move: jobMove,
      defaultJob: hexToPixi(gc.jobs.defaultJob),
      indicatorBorder: hexToPixi(gc.jobs.indicatorBorder),
      byType,
    },
    progressBar: {
      background: hexToPixi(gc.progressBar.background),
      fill: hexToPixi(gc.progressBar.fill),
      border: hexToPixi(gc.progressBar.border),
    },
    structures: { pixi: structPixi, rgba: structRgba },
    minimap: {
      background: gc.minimap.background,
      viewportRect: gc.minimap.viewportRect,
      terrain: terrainRgba,
    },
    heatmaps: {
      temperature: resolveColorScale(gc.heatmaps.temperature),
      moisture: resolveColorScale(gc.heatmaps.moisture),
      movementCost: resolveColorScale(gc.heatmaps.movementCost),
    },
    palette: {
      replacementMap,
      colors: gc.palette,
    },
  };
}

// =============================================================================
// STORE
// =============================================================================

interface GameColorState {
  /** The source hex-string game colors (theme defaults + user overrides) */
  source: GameColors;
  /** Precomputed colors in all required formats */
  resolved: ResolvedGameColors;
  /** Recompute resolved colors from a new GameColors source */
  resolve: (gameColors: GameColors) => void;
}

export const useGameColorStore = create<GameColorState>((set) => ({
  source: defaultGameColors,
  resolved: resolveGameColors(defaultGameColors),
  resolve: (gameColors: GameColors) => {
    set({
      source: gameColors,
      resolved: resolveGameColors(gameColors),
    });
  },
}));
