// =============================================================================
// ROOM TYPES
// =============================================================================

/** Computed statistics for a room */
export interface RoomStats {
  /** Number of tiles in the room */
  size: number;
  /** Average aesthetic value of the room (from structures and floors) */
  beauty: number;
  /** Total economic value of items and structures in the room */
  wealth: number;
  /** Composite score from size, beauty, and wealth */
  impressiveness: number;
}

/** A detected room — a set of passable tiles enclosed by walls and doors */
export interface Room {
  /** Unique room identifier */
  id: string;
  /** Z-level this room is on */
  zLevel: number;
  /** Set of position keys ("x,y") that belong to this room */
  tiles: Set<string>;
  /** True if the room touches the map edge (effectively outdoors) */
  isOutdoors: boolean;
  /** Computed stats, null until calculated */
  stats: RoomStats | null;
}

let roomCounter = 0;

export function generateRoomId(): string {
  return `room_${++roomCounter}`;
}
