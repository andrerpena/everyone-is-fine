// =============================================================================
// COORDINATE TYPES
// =============================================================================

/** 2D position on a single z-level */
export interface Position2D {
  x: number;
  y: number;
}

/** 3D position including z-level */
export interface Position3D extends Position2D {
  z: number;
}

/** Chunk coordinates (for future chunk-based loading) */
export interface ChunkCoord {
  chunkX: number;
  chunkY: number;
  z: number;
}

// =============================================================================
// TERRAIN LAYER - The natural ground
// =============================================================================

/** Natural terrain types (the ground itself) */
export type TerrainType =
  | "soil"
  | "sand"
  | "clay"
  | "gravel"
  | "rock"
  | "granite"
  | "limestone"
  | "marble"
  | "obsidian"
  | "water_shallow"
  | "water_deep"
  | "lava"
  | "void"; // Empty space (dug out, open air)

/** Properties of terrain */
export interface TerrainProperties {
  readonly type: TerrainType;
  readonly fertility: number; // 0-1, for farming
  readonly hardness: number; // 0-1, affects mining speed
  readonly isPassable: boolean;
  readonly isDiggable: boolean;
  readonly movementCost: number; // 1 = normal, higher = slower
}

/** Terrain layer data for a tile */
export interface TerrainData {
  type: TerrainType;
  moisture: number; // 0-1, affects plant growth
  temperature: number; // Celsius, for biome effects
}

// =============================================================================
// FLOOR LAYER - Constructed/placed floors on top of terrain
// =============================================================================

/** Constructed floor types */
export type FloorType =
  | "none"
  | "wood_plank"
  | "stone_tile"
  | "stone_flagstone"
  | "marble_tile"
  | "metal_grate"
  | "carpet"
  | "concrete"
  | "dirt_path"; // Compacted path

/** Floor layer data */
export interface FloorData {
  type: FloorType;
  material?: MaterialType; // What material was used
  condition: number; // 0-1, degrades over time
}

// =============================================================================
// STRUCTURE LAYER - Walls, doors, furniture, machines
// =============================================================================

/** Categories of structures */
export type StructureCategory =
  | "wall"
  | "door"
  | "furniture"
  | "machine"
  | "container"
  | "decoration"
  | "natural"; // Natural features like trees, boulders

/** Structure types */
export type StructureType =
  // Walls
  | "wall_stone"
  | "wall_wood"
  | "wall_metal"
  | "wall_brick"
  // Doors
  | "door_wood"
  | "door_metal"
  | "door_auto"
  // Furniture
  | "bed"
  | "chair"
  | "table"
  | "workbench"
  // Containers
  | "chest"
  | "shelf"
  | "stockpile_zone"
  // Natural
  | "tree_oak"
  | "tree_pine"
  | "bush"
  | "boulder"
  | "none";

/** Properties defining structure behavior */
export interface StructureProperties {
  readonly type: StructureType;
  readonly category: StructureCategory;
  readonly blocksMovement: boolean;
  readonly blocksVision: boolean;
  readonly isInteractable: boolean;
  readonly maxHealth: number;
  readonly flammability: number; // 0-1
}

/** Structure instance data */
export interface StructureData {
  type: StructureType;
  material?: MaterialType;
  health: number; // Current health
  ownerId?: EntityId; // For furniture ownership
  isOpen?: boolean; // For doors
  rotation: 0 | 90 | 180 | 270; // Degrees
}

// =============================================================================
// MATERIALS - Shared material system
// =============================================================================

export type MaterialType =
  | "wood_oak"
  | "wood_pine"
  | "wood_birch"
  | "stone_granite"
  | "stone_limestone"
  | "stone_marble"
  | "metal_iron"
  | "metal_steel"
  | "metal_gold"
  | "metal_copper"
  | "cloth_cotton"
  | "cloth_wool"
  | "leather";

export interface MaterialProperties {
  readonly type: MaterialType;
  readonly durability: number;
  readonly value: number;
  readonly flammability: number;
  readonly beauty: number; // Affects colonist mood
}

// =============================================================================
// ITEM LAYER - Resources and objects on the ground
// =============================================================================

/** Item categories */
export type ItemCategory =
  | "resource"
  | "food"
  | "weapon"
  | "apparel"
  | "medicine"
  | "tool"
  | "artifact";

/** Item types */
export type ItemType =
  // Resources
  | "wood"
  | "stone"
  | "iron"
  | "gold"
  | "silver"
  | "coal"
  | "cloth"
  | "leather"
  // Food
  | "meat"
  | "berries"
  | "vegetable"
  | "meal_simple"
  | "meal_fine"
  // Tools
  | "pickaxe"
  | "axe"
  | "hammer";

/** Properties defining item behavior */
export interface ItemProperties {
  readonly type: ItemType;
  readonly category: ItemCategory;
  readonly label: string;
  readonly stackSize: number;
  readonly baseValue: number; // Trade value
  readonly weight: number; // Affects hauling speed
  readonly flammability: number; // 0-1
  readonly nutrition: number; // 0-1, 0 for non-food
}

/** Unique identifier for entity references */
export type EntityId = string;

/** Item instance on the ground */
export interface ItemData {
  id: EntityId;
  type: ItemType;
  quantity: number;
  quality: number; // 0-1
  material?: MaterialType;
  condition?: number; // For degradable items
}

// =============================================================================
// TILE - Complete tile combining all layers
// =============================================================================

/** A complete tile with all layers */
export interface Tile {
  /** Natural terrain (always present) */
  terrain: TerrainData;

  /** Constructed floor (optional) */
  floor: FloorData | null;

  /** Structure occupying this tile (optional) */
  structure: StructureData | null;

  /** Items lying on the ground */
  items: ItemData[];

  /** Cached pathfinding data */
  pathfinding: TilePathfindingData;

  /** Visibility state */
  visibility: TileVisibility;
}

/** Cached pathfinding information */
export interface TilePathfindingData {
  isPassable: boolean;
  movementCost: number;
  lastUpdated: number; // Tick number for cache invalidation
}

/** Fog of war / visibility state */
export interface TileVisibility {
  explored: boolean;
  visible: boolean; // Currently in colonist sight
  lightLevel: number; // 0-1
}

// =============================================================================
// Z-LEVEL - A horizontal slice of the world
// =============================================================================

/** A single z-level containing a 2D grid of tiles */
export interface ZLevel {
  z: number;
  width: number;
  height: number;

  /**
   * Flat array of tiles, indexed as: tiles[y * width + x]
   * Using flat array for efficient serialization and memory layout
   */
  tiles: Tile[];

  /** Whether this level has been generated */
  isGenerated: boolean;

  /** Biome affecting this level */
  biome: BiomeType;
}

// =============================================================================
// WORLD - The complete world state
// =============================================================================

/** Biome types affecting generation and ambient conditions */
export type BiomeType =
  | "temperate_forest"
  | "desert"
  | "tundra"
  | "jungle"
  | "mountain"
  | "swamp"
  | "plains";

/** World metadata */
export interface WorldMetadata {
  id: string;
  name: string;
  seed: number;
  createdAt: number;
  version: string;
  tickCount: number;
}

/** World dimensions */
export interface WorldDimensions {
  width: number;
  height: number;
  minZ: number; // Usually negative for underground
  maxZ: number; // Positive for sky
}

/** The complete world state */
export interface World {
  metadata: WorldMetadata;
  dimensions: WorldDimensions;

  /**
   * Z-levels indexed by z coordinate
   * Using Map for sparse storage (only generated levels)
   */
  levels: Map<number, ZLevel>;

  /** Current surface level (ground floor) */
  surfaceZ: number;

  /** Global world state */
  time: WorldTime;
  weather: WeatherState;
}

/** Serializable version of World for saves/transfer */
export interface SerializedWorld {
  metadata: WorldMetadata;
  dimensions: WorldDimensions;
  levels: Array<[number, ZLevel]>; // Map serialized as entries
  surfaceZ: number;
  time: WorldTime;
  weather: WeatherState;
}

// =============================================================================
// TIME & WEATHER
// =============================================================================

export interface WorldTime {
  tickCount: number;
  day: number;
  hour: number; // 0-23
  minute: number; // 0-59
  season: Season;
  year: number;
}

export type Season = "spring" | "summer" | "autumn" | "winter";

export interface WeatherState {
  type: WeatherType;
  intensity: number; // 0-1
  temperature: number; // Celsius
  windSpeed: number;
  windDirection: number; // Degrees
}

export type WeatherType =
  | "clear"
  | "cloudy"
  | "rain"
  | "storm"
  | "snow"
  | "fog"
  | "heatwave";

// =============================================================================
// CONSTANTS & DEFAULTS
// =============================================================================

/** Default tile for initialization */
export const DEFAULT_TERRAIN_DATA: TerrainData = {
  type: "soil",
  moisture: 0.5,
  temperature: 20,
};

export const DEFAULT_TILE: Tile = {
  terrain: DEFAULT_TERRAIN_DATA,
  floor: null,
  structure: null,
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

/** Chunk size for future chunk-based loading */
export const CHUNK_SIZE = 16;

/** Ticks per in-game hour */
export const TICKS_PER_HOUR = 2500;

/** Ticks per in-game day */
export const TICKS_PER_DAY = TICKS_PER_HOUR * 24;
