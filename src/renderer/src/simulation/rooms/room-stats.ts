// =============================================================================
// ROOM STATS CALCULATOR
// =============================================================================
// Computes size, beauty, wealth, and impressiveness for a room.

import { FLOOR_REGISTRY } from "../../world/registries/floor-registry";
import { ITEM_REGISTRY } from "../../world/registries/item-registry";
import { STRUCTURE_REGISTRY } from "../../world/registries/structure-registry";
import type { ZLevel } from "../../world/types";
import type { Room, RoomStats } from "./room-types";

/**
 * Calculate stats for a room by iterating its tiles.
 * - Size: tile count
 * - Beauty: average structure beauty across tiles (0 for empty tiles)
 * - Wealth: sum of item values + structure values
 * - Impressiveness: composite score with diminishing returns
 */
export function calculateRoomStats(room: Room, level: ZLevel): RoomStats {
  const size = room.tiles.size;
  if (size === 0) {
    return { size: 0, beauty: 0, wealth: 0, impressiveness: 0 };
  }

  let totalBeauty = 0;
  let totalWealth = 0;

  for (const tileKey of room.tiles) {
    const [xStr, yStr] = tileKey.split(",");
    const x = Number(xStr);
    const y = Number(yStr);
    const index = y * level.width + x;
    const tile = level.tiles[index];
    if (!tile) continue;

    // Floor beauty and value
    if (tile.floor && tile.floor.type !== "none") {
      const floorProps = FLOOR_REGISTRY[tile.floor.type];
      totalBeauty += floorProps.beauty;
      totalWealth += floorProps.baseValue;
    }

    // Structure beauty and value (scaled by build quality)
    if (tile.structure) {
      const props = STRUCTURE_REGISTRY[tile.structure.type];
      const quality = tile.structure.quality ?? 1;
      totalBeauty += props.beauty * quality;
      totalWealth += props.baseValue * quality;
    }

    // Item wealth
    for (const item of tile.items) {
      const itemProps = ITEM_REGISTRY[item.type];
      totalWealth += itemProps.baseValue * item.quantity;
    }
  }

  const beauty = Math.round((totalBeauty / size) * 100) / 100;
  const impressiveness = calculateImpressiveness(size, beauty, totalWealth);

  return { size, beauty, wealth: totalWealth, impressiveness };
}

/**
 * Compute impressiveness from size, beauty, and wealth.
 * Uses logarithmic scaling for wealth and size to model diminishing returns.
 * Score is 0-100 range (unclamped — exceptional rooms can exceed 100).
 */
function calculateImpressiveness(
  size: number,
  beauty: number,
  wealth: number,
): number {
  // Size contribution: small rooms (1-4) are cramped, 9+ tiles are spacious
  const sizeScore = Math.max(0, Math.log2(size + 1) * 8 - 5);

  // Beauty contribution: scaled directly, can be negative
  const beautyScore = beauty * 15;

  // Wealth contribution: logarithmic to prevent hoarding from dominating
  const wealthScore = wealth > 0 ? Math.log10(wealth + 1) * 15 : 0;

  const raw = sizeScore + beautyScore + wealthScore;
  return Math.round(Math.max(0, raw) * 100) / 100;
}
