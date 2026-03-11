import { describe, expect, it } from "vitest";
import type { StructureData, Tile, ZLevel } from "../../world/types";
import { classifyRoom } from "./room-role";
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

function makeRoom(tileKeys: string[], isOutdoors = false): Room {
  return {
    id: "test-room",
    zLevel: 0,
    tiles: new Set(tileKeys),
    isOutdoors,
    stats: null,
    role: "generic",
  };
}

function structure(type: string): StructureData {
  return { type: type as StructureData["type"], health: 100, rotation: 0 };
}

describe("classifyRoom", () => {
  it("classifies room with 1 bed as bedroom", () => {
    const tiles = [
      makeTile(structure("bed")),
      makeTile(),
      makeTile(),
      makeTile(),
    ];
    const level = makeLevel(tiles, 2, 2);
    const room = makeRoom(["0,0", "1,0", "0,1", "1,1"]);

    expect(classifyRoom(room, level)).toBe("bedroom");
  });

  it("classifies room with 2+ beds as barracks", () => {
    const tiles = [
      makeTile(structure("bed")),
      makeTile(structure("bed")),
      makeTile(),
      makeTile(),
    ];
    const level = makeLevel(tiles, 2, 2);
    const room = makeRoom(["0,0", "1,0", "0,1", "1,1"]);

    expect(classifyRoom(room, level)).toBe("barracks");
  });

  it("classifies room with table and chair as dining_room", () => {
    const tiles = [
      makeTile(structure("table")),
      makeTile(structure("chair")),
      makeTile(),
      makeTile(),
    ];
    const level = makeLevel(tiles, 2, 2);
    const room = makeRoom(["0,0", "1,0", "0,1", "1,1"]);

    expect(classifyRoom(room, level)).toBe("dining_room");
  });

  it("classifies room with workbench as workshop", () => {
    const tiles = [
      makeTile(structure("workbench")),
      makeTile(),
      makeTile(),
      makeTile(),
    ];
    const level = makeLevel(tiles, 2, 2);
    const room = makeRoom(["0,0", "1,0", "0,1", "1,1"]);

    expect(classifyRoom(room, level)).toBe("workshop");
  });

  it("classifies room with chest as storage", () => {
    const tiles = [
      makeTile(structure("chest")),
      makeTile(),
      makeTile(),
      makeTile(),
    ];
    const level = makeLevel(tiles, 2, 2);
    const room = makeRoom(["0,0", "1,0", "0,1", "1,1"]);

    expect(classifyRoom(room, level)).toBe("storage");
  });

  it("classifies room with shelf as storage", () => {
    const tiles = [
      makeTile(structure("shelf")),
      makeTile(),
      makeTile(),
      makeTile(),
    ];
    const level = makeLevel(tiles, 2, 2);
    const room = makeRoom(["0,0", "1,0", "0,1", "1,1"]);

    expect(classifyRoom(room, level)).toBe("storage");
  });

  it("classifies empty room as generic", () => {
    const tiles = [makeTile(), makeTile(), makeTile(), makeTile()];
    const level = makeLevel(tiles, 2, 2);
    const room = makeRoom(["0,0", "1,0", "0,1", "1,1"]);

    expect(classifyRoom(room, level)).toBe("generic");
  });

  it("outdoor rooms are always generic regardless of contents", () => {
    const tiles = [
      makeTile(structure("bed")),
      makeTile(),
      makeTile(),
      makeTile(),
    ];
    const level = makeLevel(tiles, 2, 2);
    const room = makeRoom(["0,0", "1,0", "0,1", "1,1"], true);

    expect(classifyRoom(room, level)).toBe("generic");
  });

  it("bed takes priority over table+chair (bedroom not dining_room)", () => {
    const tiles = [
      makeTile(structure("bed")),
      makeTile(structure("table")),
      makeTile(structure("chair")),
      makeTile(),
    ];
    const level = makeLevel(tiles, 2, 2);
    const room = makeRoom(["0,0", "1,0", "0,1", "1,1"]);

    expect(classifyRoom(room, level)).toBe("bedroom");
  });

  it("table alone without chair is not dining_room", () => {
    const tiles = [
      makeTile(structure("table")),
      makeTile(),
      makeTile(),
      makeTile(),
    ];
    const level = makeLevel(tiles, 2, 2);
    const room = makeRoom(["0,0", "1,0", "0,1", "1,1"]);

    expect(classifyRoom(room, level)).toBe("generic");
  });
});
