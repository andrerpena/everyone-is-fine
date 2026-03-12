import { describe, expect, it } from "vitest";
import type { Tile, World, ZLevel } from "../world/types";
import { computeHomeZoneTiles, HOME_ZONE_RADIUS } from "./home-zone";

/** Create a minimal tile for testing */
function makeTile(): Tile {
  return {
    terrain: { type: "soil", moisture: 0, temperature: 0 },
    floor: null,
    structure: null,
    blueprint: null,
    items: [],
    pathfinding: { isPassable: true, movementCost: 1, lastUpdated: 0 },
    visibility: { explored: false, visible: false, lightLevel: 0 },
    snowDepth: 0,
    filth: 0,
    crop: null,
  } as Tile;
}

/** Create a minimal world with a flat tile grid for testing */
function makeWorld(
  width: number,
  height: number,
  structures?: Array<{ x: number; y: number; type: string }>,
): World {
  const tiles: Tile[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      tiles.push(makeTile());
    }
  }

  // Place structures
  for (const s of structures ?? []) {
    const idx = s.y * width + s.x;
    tiles[idx].structure = {
      type: s.type,
      health: 100,
      quality: 0.5,
      rotation: 0,
    } as Tile["structure"];
  }

  const level = {
    z: 0,
    width,
    height,
    tiles,
    isGenerated: true,
    biome: "temperate_forest",
  } as ZLevel;

  return {
    metadata: {
      id: "test",
      name: "test",
      seed: 0,
      createdAt: 0,
      version: "1.0",
      tickCount: 0,
    },
    dimensions: { width, height, minZ: 0, maxZ: 0 },
    levels: new Map([[0, level]]),
    surfaceZ: 0,
    time: {} as World["time"],
    weather: {} as World["weather"],
  };
}

describe("computeHomeZoneTiles", () => {
  it("returns empty set when no structures exist", () => {
    const world = makeWorld(10, 10);
    const tiles = computeHomeZoneTiles(world);
    expect(tiles.size).toBe(0);
  });

  it("returns empty set for natural structures only", () => {
    const world = makeWorld(10, 10, [
      { x: 5, y: 5, type: "tree_oak" },
      { x: 3, y: 3, type: "boulder" },
    ]);
    const tiles = computeHomeZoneTiles(world);
    expect(tiles.size).toBe(0);
  });

  it("expands around a player-built wall", () => {
    const world = makeWorld(10, 10, [{ x: 5, y: 5, type: "wall_stone" }]);
    const tiles = computeHomeZoneTiles(world);
    expect(tiles.size).toBeGreaterThan(0);
    expect(tiles.has("5,5")).toBe(true);
    // Manhattan distance 1 tiles
    expect(tiles.has("4,5")).toBe(true);
    expect(tiles.has("6,5")).toBe(true);
    expect(tiles.has("5,4")).toBe(true);
    expect(tiles.has("5,6")).toBe(true);
  });

  it("respects Manhattan distance radius", () => {
    const world = makeWorld(20, 20, [{ x: 10, y: 10, type: "wall_stone" }]);
    const tiles = computeHomeZoneTiles(world, HOME_ZONE_RADIUS);
    // At radius 3, tile at Manhattan distance 3 should be included
    expect(tiles.has("7,10")).toBe(true); // distance 3
    expect(tiles.has("13,10")).toBe(true); // distance 3
    // At radius 3, tile at Manhattan distance 4 should NOT be included
    expect(tiles.has("6,10")).toBe(false); // distance 4
    expect(tiles.has("14,10")).toBe(false); // distance 4
  });

  it("clamps to world boundaries", () => {
    const world = makeWorld(10, 10, [{ x: 0, y: 0, type: "wall_wood" }]);
    const tiles = computeHomeZoneTiles(world);
    // Should not include negative coordinates
    expect(tiles.has("-1,0")).toBe(false);
    expect(tiles.has("0,-1")).toBe(false);
    // Should include valid nearby tiles
    expect(tiles.has("0,0")).toBe(true);
    expect(tiles.has("1,0")).toBe(true);
    expect(tiles.has("0,1")).toBe(true);
  });

  it("merges overlapping zones from multiple structures", () => {
    const world = makeWorld(20, 20, [
      { x: 5, y: 5, type: "wall_stone" },
      { x: 7, y: 5, type: "wall_stone" },
    ]);
    const tiles = computeHomeZoneTiles(world);
    // The tile between them should be in the zone from both structures
    expect(tiles.has("6,5")).toBe(true);
    // The set should have no duplicates (it's a Set)
    expect(tiles.size).toBeGreaterThan(0);
  });

  it("ignores 'none' structure type", () => {
    const world = makeWorld(10, 10, [{ x: 5, y: 5, type: "none" }]);
    const tiles = computeHomeZoneTiles(world);
    expect(tiles.size).toBe(0);
  });

  it("uses custom radius when provided", () => {
    const world = makeWorld(20, 20, [{ x: 10, y: 10, type: "wall_stone" }]);
    const smallRadius = computeHomeZoneTiles(world, 1);
    const largeRadius = computeHomeZoneTiles(world, 5);
    expect(largeRadius.size).toBeGreaterThan(smallRadius.size);
  });
});
