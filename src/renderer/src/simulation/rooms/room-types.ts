// =============================================================================
// ROOM TYPES
// =============================================================================

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
}

let roomCounter = 0;

export function generateRoomId(): string {
  return `room_${++roomCounter}`;
}
