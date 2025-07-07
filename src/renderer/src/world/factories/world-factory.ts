import type {
  BiomeType,
  Tile,
  WeatherState,
  World,
  WorldDimensions,
  WorldMetadata,
  WorldTime,
  ZLevel,
} from "../types";
import { createTile } from "./tile-factory";

/** Generate a unique world ID */
function generateWorldId(): string {
  return `world_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/** Create world metadata */
export function createWorldMetadata(
  name: string,
  seed?: number,
): WorldMetadata {
  return {
    id: generateWorldId(),
    name,
    seed: seed ?? Math.floor(Math.random() * 2147483647),
    createdAt: Date.now(),
    version: "1.0.0",
    tickCount: 0,
  };
}

/** Create initial world time */
export function createWorldTime(): WorldTime {
  return {
    tickCount: 0,
    day: 1,
    hour: 8, // Start at 8 AM
    minute: 0,
    season: "spring",
    year: 1,
  };
}

/** Create initial weather state */
export function createWeatherState(): WeatherState {
  return {
    type: "clear",
    intensity: 0,
    temperature: 20,
    windSpeed: 5,
    windDirection: 0,
  };
}

/** Create an empty z-level */
export function createZLevel(
  z: number,
  width: number,
  height: number,
  biome: BiomeType = "temperate_forest",
): ZLevel {
  const tiles: Tile[] = new Array(width * height);

  for (let i = 0; i < tiles.length; i++) {
    tiles[i] = createTile();
  }

  return {
    z,
    width,
    height,
    tiles,
    isGenerated: false,
    biome,
  };
}

/** Create an empty world */
export function createWorld(
  name: string,
  dimensions: WorldDimensions,
  options?: {
    seed?: number;
    biome?: BiomeType;
  },
): World {
  const metadata = createWorldMetadata(name, options?.seed);
  const levels = new Map<number, ZLevel>();

  // Create the surface level (z = 0) by default
  const surfaceLevel = createZLevel(
    0,
    dimensions.width,
    dimensions.height,
    options?.biome ?? "temperate_forest",
  );
  levels.set(0, surfaceLevel);

  return {
    metadata,
    dimensions,
    levels,
    surfaceZ: 0,
    time: createWorldTime(),
    weather: createWeatherState(),
  };
}

/** Simple seeded random number generator */
export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /** Returns a random number between 0 and 1 */
  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  /** Returns a random integer between min (inclusive) and max (exclusive) */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  /** Returns true with the given probability (0-1) */
  chance(probability: number): boolean {
    return this.next() < probability;
  }

  /** Pick a random element from an array */
  pick<T>(array: readonly T[]): T {
    return array[this.nextInt(0, array.length)];
  }
}
