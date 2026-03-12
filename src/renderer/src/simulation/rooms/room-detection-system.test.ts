import { describe, expect, it } from "vitest";
import type { StructureData, Tile, ZLevel } from "../../world/types";
import {
  detectRoomsForLevel,
  ROOM_CHECK_INTERVAL,
  RoomDetectionSystem,
} from "./room-detection-system";

function makeTile(structure: StructureData | null = null): Tile {
  return {
    terrain: { type: "soil", moisture: 0.5, temperature: 20 },
    floor: null,
    structure,
    items: [],
    pathfinding: {
      isPassable: structure === null,
      movementCost: 1,
      lastUpdated: 0,
    },
    visibility: { explored: false, visible: false, lightLevel: 0 },
    snowDepth: 0,
    filth: 0,
    crop: null,
    blueprint: null,
  };
}

function wall(): StructureData {
  return { type: "wall_wood", health: 200, rotation: 0 };
}

function door(): StructureData {
  return { type: "door_wood", health: 100, rotation: 0 };
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

/**
 * Build a tile grid from an ASCII map.
 * Legend: '.' = open, '#' = wall, 'D' = door
 */
function fromAscii(rows: string[]): {
  tiles: Tile[];
  width: number;
  height: number;
} {
  const height = rows.length;
  const width = rows[0].length;
  const tiles: Tile[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const ch = rows[y][x];
      if (ch === "#") {
        tiles.push(makeTile(wall()));
      } else if (ch === "D") {
        tiles.push(makeTile(door()));
      } else {
        tiles.push(makeTile());
      }
    }
  }

  return { tiles, width, height };
}

describe("detectRoomsForLevel", () => {
  it("detects a single outdoor room on an open map", () => {
    const { tiles, width, height } = fromAscii(["...", "...", "..."]);
    const level = makeLevel(tiles, width, height);
    const rooms = detectRoomsForLevel(level);

    expect(rooms).toHaveLength(1);
    expect(rooms[0].isOutdoors).toBe(true);
    expect(rooms[0].tiles.size).toBe(9);
  });

  it("detects an enclosed room inside walls", () => {
    const { tiles, width, height } = fromAscii([
      "......",
      ".####.",
      ".#..#.",
      ".#..#.",
      ".####.",
      "......",
    ]);
    const level = makeLevel(tiles, width, height);
    const rooms = detectRoomsForLevel(level);

    // Should have 2 rooms: outdoor (touching edges) and indoor (4 tiles inside walls)
    expect(rooms).toHaveLength(2);

    const indoor = rooms.find((r) => !r.isOutdoors);
    const outdoor = rooms.find((r) => r.isOutdoors);

    expect(indoor).toBeDefined();
    expect(outdoor).toBeDefined();
    expect(indoor!.tiles.size).toBe(4); // 2x2 interior
    expect(indoor!.tiles.has("2,2")).toBe(true);
    expect(indoor!.tiles.has("3,2")).toBe(true);
    expect(indoor!.tiles.has("2,3")).toBe(true);
    expect(indoor!.tiles.has("3,3")).toBe(true);
  });

  it("treats doors as room boundaries", () => {
    const { tiles, width, height } = fromAscii([
      "......",
      ".####.",
      ".#..D.",
      ".#..#.",
      ".####.",
      "......",
    ]);
    const level = makeLevel(tiles, width, height);
    const rooms = detectRoomsForLevel(level);

    // Door separates indoor from outdoor
    const indoor = rooms.find((r) => !r.isOutdoors);
    expect(indoor).toBeDefined();
    expect(indoor!.tiles.size).toBe(4); // Interior tiles (door itself excluded)
  });

  it("detects two separate enclosed rooms", () => {
    const { tiles, width, height } = fromAscii([
      ".........",
      ".###.###.",
      ".#.#.#.#.",
      ".###.###.",
      ".........",
    ]);
    const level = makeLevel(tiles, width, height);
    const rooms = detectRoomsForLevel(level);

    const indoors = rooms.filter((r) => !r.isOutdoors);
    const outdoor = rooms.find((r) => r.isOutdoors);

    expect(indoors).toHaveLength(2);
    expect(outdoor).toBeDefined();
    expect(indoors[0].tiles.size).toBe(1); // 1x1 interior each
    expect(indoors[1].tiles.size).toBe(1);
  });

  it("furniture and trees do not form room boundaries", () => {
    // A "room" made of trees is not actually a room
    const { tiles, width, height } = fromAscii(["...", "...", "..."]);
    // Place a tree at center — shouldn't split the room
    tiles[4] = makeTile({ type: "tree_oak", health: 200, rotation: 0 });

    const level = makeLevel(tiles, width, height);
    const rooms = detectRoomsForLevel(level);

    // Tree blocks movement but is not a wall/door, so it's skipped by flood-fill
    // The tree tile itself won't be part of any room (it's not a boundary but
    // isRoomBoundary returns false for trees, so it will be part of the room)
    // Actually: isRoomBoundary checks category === "wall" || "door", trees are "natural"
    // So tree tile is NOT a boundary, gets flood-filled as part of the room
    expect(rooms).toHaveLength(1);
    expect(rooms[0].isOutdoors).toBe(true);
    expect(rooms[0].tiles.size).toBe(9); // All tiles including tree
  });

  it("map entirely filled with walls produces no rooms", () => {
    const { tiles, width, height } = fromAscii(["###", "###", "###"]);
    const level = makeLevel(tiles, width, height);
    const rooms = detectRoomsForLevel(level);

    expect(rooms).toHaveLength(0);
  });
});

describe("RoomDetectionSystem", () => {
  it("does not run before ROOM_CHECK_INTERVAL ticks", () => {
    const system = new RoomDetectionSystem(() => null);

    for (let i = 0; i < ROOM_CHECK_INTERVAL - 1; i++) {
      system.update();
    }

    expect(system.getRooms(0)).toHaveLength(0);
  });

  it("detects rooms and supports getRoomAt queries", () => {
    const { tiles, width, height } = fromAscii([
      "......",
      ".####.",
      ".#..#.",
      ".#..#.",
      ".####.",
      "......",
    ]);
    const level = makeLevel(tiles, width, height);
    const world = {
      metadata: {
        id: "test",
        name: "Test",
        createdAt: Date.now(),
        seed: 1,
        version: "1",
        tickCount: 0,
      },
      dimensions: { width, height, minZ: 0, maxZ: 0 },
      surfaceZ: 0,
      levels: new Map([[0, level]]),
      time: {
        tickCount: 0,
        day: 1,
        hour: 12,
        minute: 0,
        season: "spring" as const,
        year: 1,
      },
      weather: {
        type: "clear" as const,
        intensity: 0,
        temperature: 20,
        windSpeed: 0,
        windDirection: 0,
        forecast: "clear" as const,
      },
    };

    const system = new RoomDetectionSystem(() => world);

    // Tick to trigger detection
    for (let i = 0; i < ROOM_CHECK_INTERVAL; i++) {
      system.update();
    }

    // Query indoor tile
    const indoorRoom = system.getRoomAt(2, 2, 0);
    expect(indoorRoom).not.toBeNull();
    expect(indoorRoom!.isOutdoors).toBe(false);

    // Query outdoor tile
    const outdoorRoom = system.getRoomAt(0, 0, 0);
    expect(outdoorRoom).not.toBeNull();
    expect(outdoorRoom!.isOutdoors).toBe(true);

    // Query wall tile — should return null (boundaries aren't in rooms)
    const wallRoom = system.getRoomAt(1, 1, 0);
    expect(wallRoom).toBeNull();

    // Same room reference for tiles in same room
    const sameRoom = system.getRoomAt(3, 3, 0);
    expect(sameRoom).toBe(indoorRoom);
  });
});
