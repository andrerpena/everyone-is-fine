import { describe, expect, it } from "vitest";
import type {
  CropData,
  CropType,
  Tile,
  World,
  ZLevel,
} from "../../world/types";
import { CROP_REGISTRY } from "./crop-registry";
import {
  GROWTH_CHECK_INTERVAL,
  getStageForProgress,
  PlantGrowthSystem,
  STAGE_GROWING_MAX,
  STAGE_SEEDLING_MAX,
} from "./plant-growth-system";

function makeCrop(
  type: CropType,
  growthProgress = 0,
  stage: CropData["stage"] = "seedling",
): CropData {
  return { type, growthProgress, stage, plantedDay: 1 };
}

function makeTile(
  terrainType: string,
  crop: CropData | null = null,
  moisture = 0.5,
): Tile {
  return {
    terrain: {
      type: terrainType as Tile["terrain"]["type"],
      moisture,
      temperature: 20,
    },
    floor: null,
    structure: null,
    items: [],
    pathfinding: { isPassable: true, movementCost: 1, lastUpdated: 0 },
    visibility: { explored: false, visible: false, lightLevel: 0 },
    snowDepth: 0,
    crop,
  };
}

function makeWorld(tiles: Tile[], temperature: number): World {
  const level: ZLevel = {
    z: 0,
    width: tiles.length,
    height: 1,
    tiles,
    isGenerated: true,
    biome: "temperate_forest",
  };

  return {
    metadata: {
      id: "test",
      name: "test",
      createdAt: Date.now(),
      seed: 1,
      version: "1",
      tickCount: 0,
    },
    dimensions: { width: tiles.length, height: 1, minZ: 0, maxZ: 0 },
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
      windSpeed: 5,
      windDirection: 180,
    },
  };
}

function runTicks(system: PlantGrowthSystem, world: World, count: number) {
  for (let i = 0; i < count; i++) {
    system.update(() => world);
  }
}

describe("PlantGrowthSystem", () => {
  it("does not advance growth before check interval", () => {
    const system = new PlantGrowthSystem();
    const crop = makeCrop("potato");
    const tile = makeTile("soil", crop);
    const world = makeWorld([tile], 20);

    runTicks(system, world, GROWTH_CHECK_INTERVAL - 1);

    expect(tile.crop!.growthProgress).toBe(0);
  });

  it("advances growth after check interval", () => {
    const system = new PlantGrowthSystem();
    const crop = makeCrop("potato");
    const tile = makeTile("soil", crop);
    const world = makeWorld([tile], 20);

    runTicks(system, world, GROWTH_CHECK_INTERVAL);

    expect(tile.crop!.growthProgress).toBeGreaterThan(0);
  });

  it("transitions from seedling to growing at threshold", () => {
    const system = new PlantGrowthSystem();
    const crop = makeCrop("potato", STAGE_SEEDLING_MAX - 0.001, "seedling");
    const tile = makeTile("soil", crop);
    const world = makeWorld([tile], 20);

    // Run enough ticks to push past the threshold
    runTicks(system, world, GROWTH_CHECK_INTERVAL * 10);

    expect(tile.crop!.stage).toBe("growing");
    expect(tile.crop!.growthProgress).toBeGreaterThanOrEqual(
      STAGE_SEEDLING_MAX,
    );
  });

  it("transitions to mature at threshold", () => {
    const system = new PlantGrowthSystem();
    const crop = makeCrop("potato", STAGE_GROWING_MAX - 0.001, "growing");
    const tile = makeTile("soil", crop);
    const world = makeWorld([tile], 20);

    runTicks(system, world, GROWTH_CHECK_INTERVAL * 50);

    expect(tile.crop!.stage).toBe("mature");
    expect(tile.crop!.growthProgress).toBeGreaterThanOrEqual(STAGE_GROWING_MAX);
  });

  it("does not exceed progress of 1.0", () => {
    const system = new PlantGrowthSystem();
    const crop = makeCrop("strawberry", 0.99, "mature");
    const tile = makeTile("soil", crop);
    const world = makeWorld([tile], 20);

    runTicks(system, world, GROWTH_CHECK_INTERVAL * 100);

    expect(tile.crop!.growthProgress).toBeLessThanOrEqual(1.0);
  });

  it("wilts when temperature is below min", () => {
    const system = new PlantGrowthSystem();
    const props = CROP_REGISTRY.corn;
    const crop = makeCrop("corn", 0.5, "growing");
    const tile = makeTile("soil", crop);
    const world = makeWorld([tile], props.minTemp - 5);

    runTicks(system, world, GROWTH_CHECK_INTERVAL);

    expect(tile.crop!.stage).toBe("wilted");
  });

  it("wilts when temperature is above max", () => {
    const system = new PlantGrowthSystem();
    const props = CROP_REGISTRY.corn;
    const crop = makeCrop("corn", 0.5, "growing");
    const tile = makeTile("soil", crop);
    const world = makeWorld([tile], props.maxTemp + 5);

    runTicks(system, world, GROWTH_CHECK_INTERVAL);

    expect(tile.crop!.stage).toBe("wilted");
  });

  it("does not advance wilted crops", () => {
    const system = new PlantGrowthSystem();
    const crop = makeCrop("potato", 0.3, "wilted");
    const tile = makeTile("soil", crop);
    const world = makeWorld([tile], 20);

    runTicks(system, world, GROWTH_CHECK_INTERVAL * 10);

    expect(tile.crop!.growthProgress).toBe(0.3);
    expect(tile.crop!.stage).toBe("wilted");
  });

  it("grows faster on high-moisture fertile soil", () => {
    const systemDry = new PlantGrowthSystem();
    const cropDry = makeCrop("potato");
    const tileDry = makeTile("sand", cropDry, 0.1); // sand: fertility 0.1

    const systemWet = new PlantGrowthSystem();
    const cropWet = makeCrop("potato");
    const tileWet = makeTile("soil", cropWet, 0.9); // soil: fertility 1.0

    const worldDry = makeWorld([tileDry], 20);
    const worldWet = makeWorld([tileWet], 20);

    runTicks(systemDry, worldDry, GROWTH_CHECK_INTERVAL);
    runTicks(systemWet, worldWet, GROWTH_CHECK_INTERVAL);

    expect(tileWet.crop!.growthProgress).toBeGreaterThan(
      tileDry.crop!.growthProgress,
    );
  });

  it("skips tiles without crops", () => {
    const system = new PlantGrowthSystem();
    const tile = makeTile("soil");
    const world = makeWorld([tile], 20);

    // Should not throw
    runTicks(system, world, GROWTH_CHECK_INTERVAL);

    expect(tile.crop).toBeNull();
  });

  it("getStageForProgress returns correct stages", () => {
    expect(getStageForProgress(0)).toBe("seedling");
    expect(getStageForProgress(0.24)).toBe("seedling");
    expect(getStageForProgress(0.25)).toBe("growing");
    expect(getStageForProgress(0.5)).toBe("growing");
    expect(getStageForProgress(0.74)).toBe("growing");
    expect(getStageForProgress(0.75)).toBe("mature");
    expect(getStageForProgress(1.0)).toBe("mature");
  });
});
