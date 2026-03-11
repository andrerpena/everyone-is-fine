import { describe, expect, it } from "vitest";
import type { StructureData, Tile, ZLevel } from "../../world/types";
import { calculateRoomStats } from "./room-stats";
import type { Room } from "./room-types";

function makeTile(structure: StructureData | null = null): Tile {
  return {
    terrain: { type: "soil", moisture: 0.5, temperature: 20 },
    floor: null,
    structure,
    items: [],
    pathfinding: { isPassable: true, movementCost: 1, lastUpdated: 0 },
    visibility: { explored: false, visible: false, lightLevel: 0 },
    snowDepth: 0,
    crop: null,
    blueprint: null,
  };
}

function makeLevel(tiles: Tile[], width: number, height: number): ZLevel {
  return {
    z: 0,
    width,
    height,
    tiles,
    isGenerated: true,
    biome: "temperate_forest",
  };
}

function makeRoom(tileKeys: string[]): Room {
  return {
    id: "test-room",
    zLevel: 0,
    tiles: new Set(tileKeys),
    isOutdoors: false,
    stats: null,
  };
}

describe("calculateRoomStats", () => {
  it("computes size from tile count", () => {
    const tiles = [makeTile(), makeTile(), makeTile(), makeTile()];
    const level = makeLevel(tiles, 2, 2);
    const room = makeRoom(["0,0", "1,0", "0,1", "1,1"]);

    const stats = calculateRoomStats(room, level);
    expect(stats.size).toBe(4);
  });

  it("computes beauty from structures", () => {
    // 2x2 room, one tile has a bed (beauty: 2), one has a table (beauty: 2)
    const tiles = [
      makeTile({ type: "bed", health: 100, rotation: 0 }),
      makeTile({ type: "table", health: 80, rotation: 0 }),
      makeTile(),
      makeTile(),
    ];
    const level = makeLevel(tiles, 2, 2);
    const room = makeRoom(["0,0", "1,0", "0,1", "1,1"]);

    const stats = calculateRoomStats(room, level);
    // Beauty = (2 + 2 + 0 + 0) / 4 = 1.0
    expect(stats.beauty).toBe(1);
  });

  it("computes wealth from items and structures", () => {
    const tile0 = makeTile({ type: "bed", health: 100, rotation: 0 }); // baseValue: 60
    tile0.items = [
      { id: "i1", type: "gold", quantity: 3, quality: 1, condition: 1 },
    ]; // 10 * 3 = 30
    const tile1 = makeTile(); // empty

    const tiles = [tile0, tile1];
    const level = makeLevel(tiles, 2, 1);
    const room = makeRoom(["0,0", "1,0"]);

    const stats = calculateRoomStats(room, level);
    // Wealth = 60 (bed) + 30 (gold) = 90
    expect(stats.wealth).toBe(90);
  });

  it("returns zero stats for empty room", () => {
    const room: Room = {
      id: "empty",
      zLevel: 0,
      tiles: new Set(),
      isOutdoors: false,
      stats: null,
    };
    const level = makeLevel([], 0, 0);

    const stats = calculateRoomStats(room, level);
    expect(stats.size).toBe(0);
    expect(stats.beauty).toBe(0);
    expect(stats.wealth).toBe(0);
    expect(stats.impressiveness).toBe(0);
  });

  it("impressiveness increases with size, beauty, and wealth", () => {
    // Small bare room
    const smallTiles = [makeTile()];
    const smallLevel = makeLevel(smallTiles, 1, 1);
    const smallRoom = makeRoom(["0,0"]);
    const smallStats = calculateRoomStats(smallRoom, smallLevel);

    // Larger furnished room
    const bigTiles: Tile[] = [];
    for (let i = 0; i < 9; i++) {
      bigTiles.push(makeTile());
    }
    bigTiles[4] = makeTile({ type: "bed", health: 100, rotation: 0 }); // beauty: 2, value: 60
    bigTiles[4].items = [
      { id: "i1", type: "gold", quantity: 5, quality: 1, condition: 1 },
    ];
    const bigLevel = makeLevel(bigTiles, 3, 3);
    const bigRoom = makeRoom([
      "0,0",
      "1,0",
      "2,0",
      "0,1",
      "1,1",
      "2,1",
      "0,2",
      "1,2",
      "2,2",
    ]);
    const bigStats = calculateRoomStats(bigRoom, bigLevel);

    expect(bigStats.impressiveness).toBeGreaterThan(smallStats.impressiveness);
  });

  it("negative beauty from ugly structures lowers beauty stat", () => {
    // Room full of workbenches (beauty: -1 each)
    const uglyTiles = [
      makeTile({ type: "workbench", health: 150, rotation: 0 }),
      makeTile({ type: "workbench", health: 150, rotation: 0 }),
      makeTile({ type: "workbench", health: 150, rotation: 0 }),
      makeTile({ type: "workbench", health: 150, rotation: 0 }),
    ];
    const uglyLevel = makeLevel(uglyTiles, 2, 2);
    const uglyRoom = makeRoom(["0,0", "1,0", "0,1", "1,1"]);
    const uglyStats = calculateRoomStats(uglyRoom, uglyLevel);

    // Room full of beds (beauty: 2 each)
    const niceTiles = [
      makeTile({ type: "bed", health: 100, rotation: 0 }),
      makeTile({ type: "bed", health: 100, rotation: 0 }),
      makeTile({ type: "bed", health: 100, rotation: 0 }),
      makeTile({ type: "bed", health: 100, rotation: 0 }),
    ];
    const niceLevel = makeLevel(niceTiles, 2, 2);
    const niceRoom = makeRoom(["0,0", "1,0", "0,1", "1,1"]);
    const niceStats = calculateRoomStats(niceRoom, niceLevel);

    expect(uglyStats.beauty).toBeLessThan(0);
    expect(niceStats.beauty).toBeGreaterThan(0);
    expect(uglyStats.beauty).toBeLessThan(niceStats.beauty);
  });
});
