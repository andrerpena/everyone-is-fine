import type {
  FloorData,
  FloorType,
  MaterialType,
  StructureData,
  StructureType,
  TerrainData,
  TerrainType,
  Tile,
} from "../types";
import { DEFAULT_TERRAIN_DATA } from "../types";

/** Create a terrain data object */
export function createTerrainData(
  type: TerrainType,
  options?: Partial<Omit<TerrainData, "type">>,
): TerrainData {
  return {
    type,
    moisture: options?.moisture ?? 0.5,
    temperature: options?.temperature ?? 20,
  };
}

/** Create a floor data object */
export function createFloorData(
  type: FloorType,
  options?: {
    material?: MaterialType;
    condition?: number;
  },
): FloorData {
  return {
    type,
    material: options?.material,
    condition: options?.condition ?? 1.0,
  };
}

/** Create a structure data object */
export function createStructureData(
  type: StructureType,
  options?: {
    material?: MaterialType;
    health?: number;
    rotation?: 0 | 90 | 180 | 270;
    ownerId?: string;
    isOpen?: boolean;
  },
): StructureData {
  return {
    type,
    material: options?.material,
    health: options?.health ?? 100,
    rotation: options?.rotation ?? 0,
    ownerId: options?.ownerId,
    isOpen: options?.isOpen,
  };
}

/** Create a complete tile with default values */
export function createTile(options?: {
  terrain?: Partial<TerrainData> & { type: TerrainType };
  floor?: FloorData | null;
  structure?: StructureData | null;
}): Tile {
  const terrain = options?.terrain
    ? createTerrainData(options.terrain.type, options.terrain)
    : { ...DEFAULT_TERRAIN_DATA };

  return {
    terrain,
    floor: options?.floor ?? null,
    structure: options?.structure ?? null,
    items: [],
    pathfinding: {
      isPassable: true,
      movementCost: 1,
      lastUpdated: 0,
    },
    visibility: {
      explored: false,
      visible: false,
      lightLevel: 0,
    },
  };
}

/** Clone a tile (deep copy) */
export function cloneTile(tile: Tile): Tile {
  return {
    terrain: { ...tile.terrain },
    floor: tile.floor ? { ...tile.floor } : null,
    structure: tile.structure ? { ...tile.structure } : null,
    items: tile.items.map((item) => ({ ...item })),
    pathfinding: { ...tile.pathfinding },
    visibility: { ...tile.visibility },
  };
}
