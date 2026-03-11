import { describe, expect, it } from "vitest";
import type { ItemData, World, ZLevel } from "../../world/types";
import { ItemDeteriorationSystem } from "./item-deterioration-system";

/** Helper to create a minimal world with one tile containing given items */
function makeWorld(items: ItemData[]): World {
  const tile = {
    terrain: { type: "soil" as const, moisture: 0.5, temperature: 20 },
    floor: null,
    structure: null,
    items,
    pathfinding: { isPassable: true, movementCost: 1, lastUpdated: 0 },
    visibility: { explored: false, visible: false, lightLevel: 0 },
    snowDepth: 0,
    crop: null,
  };

  const level: ZLevel = {
    z: 0,
    width: 1,
    height: 1,
    tiles: [tile],
    isGenerated: true,
    biome: "temperate_forest",
  };

  return {
    metadata: {
      id: "test",
      name: "test",
      seed: 0,
      createdAt: 0,
      version: "1",
      tickCount: 0,
    },
    dimensions: { width: 1, height: 1, minZ: 0, maxZ: 0 },
    levels: new Map([[0, level]]),
    surfaceZ: 0,
    time: {
      tickCount: 0,
      day: 1,
      hour: 12,
      minute: 0,
      season: "summer",
      year: 1,
    },
    weather: {
      type: "clear",
      intensity: 0,
      temperature: 25,
      windSpeed: 0,
      windDirection: 0,
    },
  };
}

function makeItem(condition?: number): ItemData {
  return {
    id: "item_1",
    type: "wood",
    quantity: 5,
    quality: 1,
    condition,
  };
}

describe("ItemDeteriorationSystem", () => {
  it("does nothing before CHECK_INTERVAL ticks", () => {
    const system = new ItemDeteriorationSystem();
    const item = makeItem(1);
    const world = makeWorld([item]);

    // Tick 299 times (interval is 300)
    for (let i = 0; i < 299; i++) {
      system.update(() => world);
    }
    expect(item.condition).toBe(1);
  });

  it("reduces condition after CHECK_INTERVAL ticks", () => {
    const system = new ItemDeteriorationSystem();
    const item = makeItem(1);
    const world = makeWorld([item]);

    for (let i = 0; i < 300; i++) {
      system.update(() => world);
    }
    expect(item.condition).toBeCloseTo(0.998, 5);
  });

  it("removes items when condition reaches 0", () => {
    const system = new ItemDeteriorationSystem();
    const item = makeItem(0.001);
    const world = makeWorld([item]);

    // One full interval
    for (let i = 0; i < 300; i++) {
      system.update(() => world);
    }
    expect(world.levels.get(0)!.tiles[0].items.length).toBe(0);
  });

  it("initializes condition for legacy items without it", () => {
    const system = new ItemDeteriorationSystem();
    const item = makeItem(undefined);
    const world = makeWorld([item]);

    for (let i = 0; i < 300; i++) {
      system.update(() => world);
    }
    // Should have been initialized to 1, then reduced by 0.002
    expect(item.condition).toBeCloseTo(0.998, 5);
  });

  it("condition never goes below 0", () => {
    const system = new ItemDeteriorationSystem();
    const item = makeItem(0.0005);
    const world = makeWorld([item]);

    for (let i = 0; i < 300; i++) {
      system.update(() => world);
    }
    // Item removed (condition <= 0), but verify via splice
    expect(world.levels.get(0)!.tiles[0].items.length).toBe(0);
  });
});
