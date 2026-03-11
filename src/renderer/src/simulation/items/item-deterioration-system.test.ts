import { describe, expect, it } from "vitest";
import type { ItemData, World, ZLevel } from "../../world/types";
import {
  BASE_DETERIORATION_RATE,
  CHECK_INTERVAL,
  getSpoilageRate,
  ItemDeteriorationSystem,
  SPOILAGE_COLD_MULTIPLIER,
  SPOILAGE_COLD_THRESHOLD,
  SPOILAGE_HEAT_MULTIPLIER,
  SPOILAGE_HEAT_THRESHOLD,
} from "./item-deterioration-system";

/** Helper to create a minimal world with one tile containing given items */
function makeWorld(items: ItemData[], temperature = 20): World {
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
      temperature,
      windSpeed: 0,
      windDirection: 0,
    },
  };
}

function makeItem(
  type: ItemData["type"] = "wood",
  condition?: number,
): ItemData {
  return {
    id: `item_${Math.random().toString(36).substring(2, 9)}`,
    type,
    quantity: 5,
    quality: 1,
    condition,
  };
}

function runTicks(
  system: ItemDeteriorationSystem,
  world: World,
  count: number,
) {
  for (let i = 0; i < count; i++) {
    system.update(() => world);
  }
}

describe("ItemDeteriorationSystem", () => {
  describe("base deterioration (non-food)", () => {
    it("does nothing before CHECK_INTERVAL ticks", () => {
      const system = new ItemDeteriorationSystem();
      const item = makeItem("wood", 1);
      const world = makeWorld([item]);

      runTicks(system, world, CHECK_INTERVAL - 1);
      expect(item.condition).toBe(1);
    });

    it("reduces condition after CHECK_INTERVAL ticks", () => {
      const system = new ItemDeteriorationSystem();
      const item = makeItem("wood", 1);
      const world = makeWorld([item]);

      runTicks(system, world, CHECK_INTERVAL);
      expect(item.condition).toBeCloseTo(1 - BASE_DETERIORATION_RATE, 5);
    });

    it("removes items when condition reaches 0", () => {
      const system = new ItemDeteriorationSystem();
      const item = makeItem("wood", 0.001);
      const world = makeWorld([item]);

      runTicks(system, world, CHECK_INTERVAL);
      expect(world.levels.get(0)!.tiles[0].items.length).toBe(0);
    });

    it("initializes condition for legacy items without it", () => {
      const system = new ItemDeteriorationSystem();
      const item = makeItem("wood", undefined);
      const world = makeWorld([item]);

      runTicks(system, world, CHECK_INTERVAL);
      expect(item.condition).toBeCloseTo(1 - BASE_DETERIORATION_RATE, 5);
    });

    it("condition never goes below 0", () => {
      const system = new ItemDeteriorationSystem();
      const item = makeItem("wood", 0.0005);
      const world = makeWorld([item]);

      runTicks(system, world, CHECK_INTERVAL);
      expect(world.levels.get(0)!.tiles[0].items.length).toBe(0);
    });
  });

  describe("food spoilage", () => {
    it("food spoils faster than non-food items", () => {
      const woodSystem = new ItemDeteriorationSystem();
      const woodItem = makeItem("wood", 1);
      const woodWorld = makeWorld([woodItem]);

      const meatSystem = new ItemDeteriorationSystem();
      const meatItem = makeItem("meat", 1);
      const meatWorld = makeWorld([meatItem]);

      runTicks(woodSystem, woodWorld, CHECK_INTERVAL);
      runTicks(meatSystem, meatWorld, CHECK_INTERVAL);

      // Meat (spoilageRate 0.01) should lose more condition than wood (base 0.002)
      expect(meatItem.condition!).toBeLessThan(woodItem.condition!);
    });

    it("raw meat spoils faster than vegetables", () => {
      const meatSystem = new ItemDeteriorationSystem();
      const meatItem = makeItem("meat", 1);
      const meatWorld = makeWorld([meatItem]);

      const vegSystem = new ItemDeteriorationSystem();
      const vegItem = makeItem("vegetable", 1);
      const vegWorld = makeWorld([vegItem]);

      runTicks(meatSystem, meatWorld, CHECK_INTERVAL);
      runTicks(vegSystem, vegWorld, CHECK_INTERVAL);

      // meat spoilageRate (0.01) > vegetable spoilageRate (0.006)
      expect(meatItem.condition!).toBeLessThan(vegItem.condition!);
    });

    it("vegetables spoil faster than cooked meals", () => {
      const vegSystem = new ItemDeteriorationSystem();
      const vegItem = makeItem("vegetable", 1);
      const vegWorld = makeWorld([vegItem]);

      const mealSystem = new ItemDeteriorationSystem();
      const mealItem = makeItem("meal_simple", 1);
      const mealWorld = makeWorld([mealItem]);

      runTicks(vegSystem, vegWorld, CHECK_INTERVAL);
      runTicks(mealSystem, mealWorld, CHECK_INTERVAL);

      // vegetable spoilageRate (0.006) > meal_simple spoilageRate (0.003)
      expect(vegItem.condition!).toBeLessThan(mealItem.condition!);
    });
  });

  describe("temperature effects on spoilage", () => {
    it("food spoils faster in hot temperatures", () => {
      const normalSystem = new ItemDeteriorationSystem();
      const normalItem = makeItem("meat", 1);
      const normalWorld = makeWorld([normalItem], 20); // normal temp

      const hotSystem = new ItemDeteriorationSystem();
      const hotItem = makeItem("meat", 1);
      const hotWorld = makeWorld([hotItem], 35); // above heat threshold

      runTicks(normalSystem, normalWorld, CHECK_INTERVAL);
      runTicks(hotSystem, hotWorld, CHECK_INTERVAL);

      expect(hotItem.condition!).toBeLessThan(normalItem.condition!);
    });

    it("food spoils slower in cold temperatures", () => {
      const normalSystem = new ItemDeteriorationSystem();
      const normalItem = makeItem("meat", 1);
      const normalWorld = makeWorld([normalItem], 20);

      const coldSystem = new ItemDeteriorationSystem();
      const coldItem = makeItem("meat", 1);
      const coldWorld = makeWorld([coldItem], 2); // below cold threshold

      runTicks(normalSystem, normalWorld, CHECK_INTERVAL);
      runTicks(coldSystem, coldWorld, CHECK_INTERVAL);

      expect(coldItem.condition!).toBeGreaterThan(normalItem.condition!);
    });

    it("temperature does not affect non-food items", () => {
      const normalSystem = new ItemDeteriorationSystem();
      const normalItem = makeItem("wood", 1);
      const normalWorld = makeWorld([normalItem], 20);

      const hotSystem = new ItemDeteriorationSystem();
      const hotItem = makeItem("wood", 1);
      const hotWorld = makeWorld([hotItem], 35);

      runTicks(normalSystem, normalWorld, CHECK_INTERVAL);
      runTicks(hotSystem, hotWorld, CHECK_INTERVAL);

      // Both should deteriorate at the same base rate
      expect(hotItem.condition!).toBeCloseTo(normalItem.condition!, 5);
    });
  });

  describe("getSpoilageRate helper", () => {
    it("returns 0 for non-perishable items", () => {
      expect(getSpoilageRate(0, 20)).toBe(0);
    });

    it("returns base rate at normal temperature", () => {
      expect(getSpoilageRate(0.01, 15)).toBe(0.01);
    });

    it("doubles rate above heat threshold", () => {
      expect(getSpoilageRate(0.01, SPOILAGE_HEAT_THRESHOLD + 1)).toBeCloseTo(
        0.01 * SPOILAGE_HEAT_MULTIPLIER,
      );
    });

    it("halves rate below cold threshold", () => {
      expect(getSpoilageRate(0.01, SPOILAGE_COLD_THRESHOLD - 1)).toBeCloseTo(
        0.01 * SPOILAGE_COLD_MULTIPLIER,
      );
    });
  });
});
