// =============================================================================
// ZONE TYPES
// =============================================================================

import type { CropType } from "../world/types";
import type { StockpileFilter } from "./stockpile-filter";

/** Types of zones that can be designated */
export type ZoneType = "stockpile" | "growing" | "dumping" | "allowed_area";

/** Stockpile priority levels (lower value = higher priority) */
export type ZonePriority = 1 | 2 | 3;

/** Human-readable labels for zone priorities */
export const ZONE_PRIORITY_LABELS: Record<ZonePriority, string> = {
  1: "Preferred",
  2: "Normal",
  3: "Low",
};

/** A tile key in "x,y" format */
export type ZoneTileKey = string;

/** A designated zone spanning one or more tiles */
export interface ZoneData {
  readonly id: string;
  readonly type: ZoneType;
  name: string;
  zLevel: number;
  /** Set of tile keys ("x,y") belonging to this zone */
  tiles: Set<ZoneTileKey>;
  /** Item filter for stockpile zones (only meaningful when type === "stockpile") */
  filter?: StockpileFilter;
  /** Priority for stockpile zones: 1=preferred, 2=normal, 3=low (only meaningful when type === "stockpile") */
  priority?: ZonePriority;
  /** Crop type for growing zones (only meaningful when type === "growing") */
  cropType?: CropType;
}

/** Zone display colors (semi-transparent overlays) */
export const ZONE_COLORS: Record<ZoneType, number> = {
  stockpile: 0xf5c542, // Yellow
  growing: 0x42f554, // Green
  dumping: 0xf54242, // Red
  allowed_area: 0x42b4f5, // Blue
};

/** Zone overlay alpha */
export const ZONE_ALPHA = 0.25;

/** Zone info exposed to agents */
export interface AgentZoneInfo {
  id: string;
  type: ZoneType;
  name: string;
  zLevel: number;
  tileCount: number;
  priority?: ZonePriority;
}
