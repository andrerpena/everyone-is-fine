import type { SerializedWorld, World } from "../types";

/** Serialize a world for saving or Web Worker transfer */
export function serializeWorld(world: World): SerializedWorld {
  return {
    metadata: { ...world.metadata },
    dimensions: { ...world.dimensions },
    levels: Array.from(world.levels.entries()),
    surfaceZ: world.surfaceZ,
    time: { ...world.time },
    weather: { ...world.weather },
  };
}

/** Deserialize a world from saved data */
export function deserializeWorld(data: SerializedWorld): World {
  return {
    metadata: { ...data.metadata },
    dimensions: { ...data.dimensions },
    levels: new Map(data.levels),
    surfaceZ: data.surfaceZ,
    time: { ...data.time },
    weather: { ...data.weather },
  };
}

/** Convert world to JSON string */
export function worldToJson(world: World): string {
  return JSON.stringify(serializeWorld(world));
}

/** Parse world from JSON string */
export function jsonToWorld(json: string): World {
  const data = JSON.parse(json) as SerializedWorld;
  return deserializeWorld(data);
}

/** Clone a world (deep copy) */
export function cloneWorld(world: World): World {
  return deserializeWorld(serializeWorld(world));
}

/** Estimate serialized size in bytes (approximate) */
export function estimateWorldSize(world: World): number {
  let totalTiles = 0;
  for (const level of world.levels.values()) {
    totalTiles += level.tiles.length;
  }

  // Rough estimate: ~100 bytes per tile + overhead
  return totalTiles * 100 + 1000;
}
