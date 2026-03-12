// =============================================================================
// ROOM ROLE CLASSIFICATION
// =============================================================================
// Classifies rooms by their functional role based on structure contents.

import type { ZLevel } from "../../world/types";
import type { Room, RoomRole } from "./room-types";

/**
 * Classify a room's role based on the structures it contains.
 * Rules are ordered by specificity — first match wins.
 * Outdoor rooms are always "generic".
 */
export function classifyRoom(room: Room, level: ZLevel): RoomRole {
  if (room.isOutdoors) return "generic";

  let beds = 0;
  let tables = 0;
  let chairs = 0;
  let workbenches = 0;
  let containers = 0; // chests + shelves

  for (const tileKey of room.tiles) {
    const [xStr, yStr] = tileKey.split(",");
    const x = Number(xStr);
    const y = Number(yStr);
    const index = y * level.width + x;
    const tile = level.tiles[index];
    if (!tile?.structure) continue;

    switch (tile.structure.type) {
      case "bed":
        beds++;
        break;
      case "table":
        tables++;
        break;
      case "chair":
        chairs++;
        break;
      case "workbench":
      case "stonecutter_table":
      case "tailoring_bench":
      case "crafting_spot":
        workbenches++;
        break;
      case "chest":
      case "shelf":
        containers++;
        break;
    }
  }

  // Classification rules (ordered by specificity)
  if (beds === 1) return "bedroom";
  if (beds >= 2) return "barracks";
  if (tables > 0 && chairs > 0) return "dining_room";
  if (workbenches > 0) return "workshop";
  if (containers > 0) return "storage";

  return "generic";
}
