// =============================================================================
// ROOM TYPES
// =============================================================================

/** Functional role of a room based on its contents */
export type RoomRole =
  | "bedroom"
  | "barracks"
  | "dining_room"
  | "workshop"
  | "storage"
  | "generic";

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
  /** True if the room has a roof (indoor rooms are automatically roofed) */
  isRoofed: boolean;
  /** Indoor temperature in °C (null for outdoor rooms or before calculation) */
  temperature: number | null;
  /** Computed stats, null until calculated */
  stats: RoomStats | null;
  /** Functional role based on room contents */
  role: RoomRole;
}

let roomCounter = 0;

export function generateRoomId(): string {
  return `room_${++roomCounter}`;
}
