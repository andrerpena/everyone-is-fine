// =============================================================================
// ZONE TYPES
// =============================================================================

/** Types of zones that can be designated */
export type ZoneType = "stockpile" | "growing" | "dumping";

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
}

/** Zone display colors (semi-transparent overlays) */
export const ZONE_COLORS: Record<ZoneType, number> = {
  stockpile: 0xf5c542, // Yellow
  growing: 0x42f554, // Green
  dumping: 0xf54242, // Red
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
}
