// =============================================================================
// ROOM DETECTION SYSTEM
// =============================================================================
// Periodically scans the world to detect enclosed rooms bounded by walls/doors.
// Uses flood-fill on cardinal neighbors to group passable, non-boundary tiles.

import { STRUCTURE_REGISTRY } from "../../world/registries/structure-registry";
import type { World, ZLevel } from "../../world/types";
import { getIndoorTemperature } from "./indoor-temperature";
import { classifyRoom } from "./room-role";
import { calculateRoomStats } from "./room-stats";
import { generateRoomId, type Room } from "./room-types";

/** How often (in ticks) the system re-detects rooms */
export const ROOM_CHECK_INTERVAL = 300;

/**
 * Returns true if the tile at (x, y) is a room boundary.
 * Walls and doors are boundaries. Trees, boulders, and furniture are not
 * (they block movement but don't form room walls).
 */
function isRoomBoundary(level: ZLevel, x: number, y: number): boolean {
  const index = y * level.width + x;
  const tile = level.tiles[index];
  if (!tile) return true; // Out-of-bounds treated as boundary

  const structure = tile.structure;
  if (!structure) return false;

  const props = STRUCTURE_REGISTRY[structure.type];
  return props.category === "wall" || props.category === "door";
}

/**
 * Detect all rooms on a single z-level using flood-fill.
 * Walls and doors act as boundaries. Tiles touching the map edge
 * belong to the "outdoors" room.
 */
export function detectRoomsForLevel(level: ZLevel): Room[] {
  const visited = new Set<string>();
  const rooms: Room[] = [];

  for (let y = 0; y < level.height; y++) {
    for (let x = 0; x < level.width; x++) {
      const key = `${x},${y}`;
      if (visited.has(key)) continue;
      if (isRoomBoundary(level, x, y)) {
        visited.add(key);
        continue;
      }

      // Flood-fill from this tile
      const roomTiles = new Set<string>();
      let touchesEdge = false;
      const queue: Array<{ x: number; y: number }> = [{ x, y }];
      visited.add(key);

      while (queue.length > 0) {
        const pos = queue.pop()!;
        roomTiles.add(`${pos.x},${pos.y}`);

        // Check if touching map edge
        if (
          pos.x === 0 ||
          pos.y === 0 ||
          pos.x === level.width - 1 ||
          pos.y === level.height - 1
        ) {
          touchesEdge = true;
        }

        // Expand to cardinal neighbors
        const neighbors = [
          { x: pos.x, y: pos.y - 1 },
          { x: pos.x + 1, y: pos.y },
          { x: pos.x, y: pos.y + 1 },
          { x: pos.x - 1, y: pos.y },
        ];

        for (const n of neighbors) {
          if (n.x < 0 || n.y < 0 || n.x >= level.width || n.y >= level.height)
            continue;
          const nKey = `${n.x},${n.y}`;
          if (visited.has(nKey)) continue;
          visited.add(nKey);

          if (isRoomBoundary(level, n.x, n.y)) continue;

          queue.push(n);
        }
      }

      rooms.push({
        id: generateRoomId(),
        zLevel: level.z,
        tiles: roomTiles,
        isOutdoors: touchesEdge,
        isRoofed: !touchesEdge,
        temperature: null,
        stats: null,
        role: "generic",
      });
    }
  }

  return rooms;
}

export class RoomDetectionSystem {
  private ticksSinceLastCheck = 0;
  /** Rooms per z-level */
  private roomsByLevel = new Map<number, Room[]>();
  /** Fast lookup: "x,y,z" → Room */
  private roomLookup = new Map<string, Room>();

  constructor(private getWorld: () => World | null) {}

  update(): void {
    this.ticksSinceLastCheck++;
    if (this.ticksSinceLastCheck < ROOM_CHECK_INTERVAL) return;
    this.ticksSinceLastCheck = 0;

    const world = this.getWorld();
    if (!world) return;

    this.roomsByLevel.clear();
    this.roomLookup.clear();

    for (const level of world.levels.values()) {
      const rooms = detectRoomsForLevel(level);

      // Compute stats, temperature, and classify indoor rooms
      const outdoorTemp = world.weather.temperature;
      for (const room of rooms) {
        if (!room.isOutdoors) {
          room.stats = calculateRoomStats(room, level);
          room.role = classifyRoom(room, level);
          room.temperature = room.isRoofed
            ? getIndoorTemperature(outdoorTemp)
            : null;
        }
      }

      this.roomsByLevel.set(level.z, rooms);

      for (const room of rooms) {
        for (const tileKey of room.tiles) {
          this.roomLookup.set(`${tileKey},${level.z}`, room);
        }
      }
    }
  }

  /** Get the room at a specific position, or null if on a boundary tile */
  getRoomAt(x: number, y: number, z: number): Room | null {
    return this.roomLookup.get(`${x},${y},${z}`) ?? null;
  }

  /** Get all rooms on a z-level */
  getRooms(z: number): Room[] {
    return this.roomsByLevel.get(z) ?? [];
  }
}
