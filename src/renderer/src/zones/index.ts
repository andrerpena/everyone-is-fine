// =============================================================================
// ZONE MODULE EXPORTS
// =============================================================================

export type { StockpileFilter } from "./stockpile-filter";
export {
  ALL_CATEGORIES,
  CATEGORY_ITEMS,
  createDefaultFilter,
  doesItemPassFilter,
} from "./stockpile-filter";
export type {
  AgentZoneInfo,
  ZoneData,
  ZoneTileKey,
  ZoneType,
} from "./types";
export { ZONE_ALPHA, ZONE_COLORS } from "./types";
export { useZoneStore } from "./zone-store";

// Local import for use within this module
import { useZoneStore as _useZoneStore } from "./zone-store";

/**
 * Get the allowed tiles set for a character's allowed area.
 * Returns undefined if the character has no allowed area (unrestricted).
 */
export function getAllowedTilesForCharacter(
  allowedAreaId: string | null,
): ReadonlySet<string> | undefined {
  if (!allowedAreaId) return undefined;
  const zone = _useZoneStore.getState().zones.get(allowedAreaId);
  if (!zone || zone.type !== "allowed_area") return undefined;
  return zone.tiles;
}
