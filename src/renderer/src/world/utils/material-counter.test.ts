import { describe, expect, it } from "vitest";
import type { ItemData, Tile, World, ZLevel } from "../types";
import {
  countAllItemsOnMap,
  countItemsOnMap,
  hasSufficientMaterials,
} from "./material-counter";

function makeTile(
  items: ItemData[] = [],
  blueprint: { type: string } | null = null,
): Tile {
  return {
    terrain: { type: "soil", moisture: 0.5, temperature: 20 },
    floor: null,
    structure: null,
    items,
    pathfinding: { isPassable: true, movementCost: 1, lastUpdated: 0 },
    visibility: { explored: false, visible: false, lightLevel: 0 },
    snowDepth: 0,
    filth: 0,
    crop: null,
    blueprint: blueprint as Tile["blueprint"],
  };
}

function makeItem(type: string, quantity: number): ItemData {
  return {
    id: `item_${Math.random().toString(36).slice(2)}`,
    type: type as ItemData["type"],
    quantity,
    quality: 1,
  };
}

function makeLevel(tiles: Tile[]): ZLevel {
  return {
    z: 0,
    width: tiles.length,
    height: 1,
    tiles,
    isGenerated: true,
    biome: "temperate_forest",
  };
}

function makeWorld(levels: ZLevel[]): World {
  const levelMap = new Map<number, ZLevel>();
  for (const level of levels) {
    levelMap.set(level.z, level);
  }
  return {
    metadata: {
      id: "test",
      name: "Test",
      seed: 42,
      createdAt: Date.now(),
      version: "1",
      tickCount: 0,
    },
    dimensions: { width: 10, height: 10, minZ: 0, maxZ: 0 },
    levels: levelMap,
    surfaceZ: 0,
    time: {
      tickCount: 0,
      day: 1,
      hour: 12,
      minute: 0,
      season: "spring",
      year: 1,
    },
    weather: {
      type: "clear",
      intensity: 0,
      temperature: 20,
      windSpeed: 0,
      windDirection: 0,
      forecast: "clear",
    },
  };
}

describe("countItemsOnMap", () => {
  it("counts items of a specific type across tiles", () => {
    const tiles = [
      makeTile([makeItem("wood", 10)]),
      makeTile([makeItem("wood", 5), makeItem("stone", 3)]),
      makeTile([]),
    ];
    const world = makeWorld([makeLevel(tiles)]);

    expect(countItemsOnMap(world, "wood")).toBe(15);
    expect(countItemsOnMap(world, "stone")).toBe(3);
    expect(countItemsOnMap(world, "iron")).toBe(0);
  });

  it("returns 0 for empty world", () => {
    const world = makeWorld([makeLevel([makeTile()])]);
    expect(countItemsOnMap(world, "wood")).toBe(0);
  });
});

describe("countAllItemsOnMap", () => {
  it("returns counts for all item types", () => {
    const tiles = [
      makeTile([makeItem("wood", 10), makeItem("stone", 5)]),
      makeTile([makeItem("wood", 3)]),
    ];
    const world = makeWorld([makeLevel(tiles)]);

    const counts = countAllItemsOnMap(world);
    expect(counts.get("wood")).toBe(13);
    expect(counts.get("stone")).toBe(5);
    expect(counts.has("iron")).toBe(false);
  });
});

describe("hasSufficientMaterials", () => {
  const noCost = () => null;

  it("returns sufficient when materials available", () => {
    const tiles = [makeTile([makeItem("wood", 10)])];
    const world = makeWorld([makeLevel(tiles)]);

    const result = hasSufficientMaterials(
      world,
      [{ type: "wood", quantity: 5 }],
      noCost,
    );
    expect(result.sufficient).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it("returns insufficient with missing details", () => {
    const tiles = [makeTile([makeItem("wood", 2)])];
    const world = makeWorld([makeLevel(tiles)]);

    const result = hasSufficientMaterials(
      world,
      [{ type: "wood", quantity: 5 }],
      noCost,
    );
    expect(result.sufficient).toBe(false);
    expect(result.missing).toHaveLength(1);
    expect(result.missing[0]).toEqual({
      type: "wood",
      needed: 5,
      available: 2,
    });
  });

  it("checks multiple material types", () => {
    const tiles = [makeTile([makeItem("wood", 10)])];
    const world = makeWorld([makeLevel(tiles)]);

    const result = hasSufficientMaterials(
      world,
      [
        { type: "wood", quantity: 3 },
        { type: "iron", quantity: 2 },
      ],
      noCost,
    );
    expect(result.sufficient).toBe(false);
    expect(result.missing).toHaveLength(1);
    expect(result.missing[0].type).toBe("iron");
  });

  it("accounts for materials reserved by existing blueprints", () => {
    const tiles = [
      makeTile([makeItem("wood", 10)]),
      makeTile([], { type: "wall_wood" }),
    ];
    const world = makeWorld([makeLevel(tiles)]);

    // wall_wood costs 5 wood, so 10 - 5 = 5 effective available
    const getCost = (type: string) => {
      if (type === "wall_wood") {
        return { materials: [{ type: "wood" as const, quantity: 5 }] };
      }
      return null;
    };

    const result = hasSufficientMaterials(
      world,
      [{ type: "wood", quantity: 8 }],
      getCost,
    );
    expect(result.sufficient).toBe(false);
    expect(result.missing[0].available).toBe(5);
  });
});
