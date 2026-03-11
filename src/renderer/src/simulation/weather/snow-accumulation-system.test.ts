import { describe, expect, it } from "vitest";
import type { Tile, World, ZLevel } from "../../world/types";
import {
  SNOW_ACCUMULATION_RATE,
  SNOW_CHECK_INTERVAL,
  SNOW_MAX_DEPTH,
  SNOW_MELT_RATE,
  SnowAccumulationSystem,
} from "./snow-accumulation-system";

function makeTile(terrainType: string, snowDepth = 0): Tile {
  return {
    terrain: {
      type: terrainType as Tile["terrain"]["type"],
      moisture: 0.5,
      temperature: 20,
    },
    floor: null,
    structure: null,
    items: [],
    pathfinding: { isPassable: true, movementCost: 1, lastUpdated: 0 },
    visibility: { explored: false, visible: false, lightLevel: 0 },
    snowDepth,
    crop: null,
  };
}

function makeWorld(
  tiles: Tile[],
  weatherType: string,
  temperature: number,
  intensity = 0.8,
): World {
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
      season: "winter",
      year: 1,
    },
    weather: {
      type: weatherType as World["weather"]["type"],
      intensity,
      temperature,
      windSpeed: 5,
      windDirection: 180,
    },
  };
}

describe("SnowAccumulationSystem", () => {
  it("does not accumulate before check interval", () => {
    const system = new SnowAccumulationSystem();
    const tile = makeTile("soil");
    const world = makeWorld([tile], "snow", -5);

    // Run less than CHECK_INTERVAL ticks
    for (let i = 0; i < SNOW_CHECK_INTERVAL - 1; i++) {
      system.update(() => world);
    }

    expect(tile.snowDepth).toBe(0);
  });

  it("accumulates snow during snowy weather", () => {
    const system = new SnowAccumulationSystem();
    const tile = makeTile("soil");
    const world = makeWorld([tile], "snow", -5);

    // Run exactly CHECK_INTERVAL ticks
    for (let i = 0; i < SNOW_CHECK_INTERVAL; i++) {
      system.update(() => world);
    }

    expect(tile.snowDepth).toBeGreaterThan(0);
    expect(tile.snowDepth).toBeCloseTo(
      SNOW_ACCUMULATION_RATE * world.weather.intensity,
    );
  });

  it("does not exceed max depth", () => {
    const system = new SnowAccumulationSystem();
    const tile = makeTile("soil", SNOW_MAX_DEPTH - 0.001);
    const world = makeWorld([tile], "snow", -5);

    for (let i = 0; i < SNOW_CHECK_INTERVAL; i++) {
      system.update(() => world);
    }

    expect(tile.snowDepth).toBe(SNOW_MAX_DEPTH);
  });

  it("melts snow when temperature above freezing and not snowing", () => {
    const system = new SnowAccumulationSystem();
    const tile = makeTile("soil", 0.5);
    const world = makeWorld([tile], "clear", 5);

    for (let i = 0; i < SNOW_CHECK_INTERVAL; i++) {
      system.update(() => world);
    }

    expect(tile.snowDepth).toBeCloseTo(0.5 - SNOW_MELT_RATE);
  });

  it("does not melt below zero", () => {
    const system = new SnowAccumulationSystem();
    const tile = makeTile("soil", 0.001);
    const world = makeWorld([tile], "clear", 5);

    for (let i = 0; i < SNOW_CHECK_INTERVAL; i++) {
      system.update(() => world);
    }

    expect(tile.snowDepth).toBe(0);
  });

  it("does not accumulate on water tiles", () => {
    const system = new SnowAccumulationSystem();
    const waterTile = makeTile("water_deep");
    const soilTile = makeTile("soil");
    const world = makeWorld([waterTile, soilTile], "snow", -5);

    for (let i = 0; i < SNOW_CHECK_INTERVAL; i++) {
      system.update(() => world);
    }

    expect(waterTile.snowDepth).toBe(0);
    expect(soilTile.snowDepth).toBeGreaterThan(0);
  });

  it("does not accumulate on lava tiles", () => {
    const system = new SnowAccumulationSystem();
    const tile = makeTile("lava");
    const world = makeWorld([tile], "snow", -5);

    for (let i = 0; i < SNOW_CHECK_INTERVAL; i++) {
      system.update(() => world);
    }

    expect(tile.snowDepth).toBe(0);
  });

  it("does not melt when temperature is below freezing", () => {
    const system = new SnowAccumulationSystem();
    const tile = makeTile("soil", 0.5);
    const world = makeWorld([tile], "clear", -2);

    for (let i = 0; i < SNOW_CHECK_INTERVAL; i++) {
      system.update(() => world);
    }

    expect(tile.snowDepth).toBe(0.5);
  });

  it("accumulation rate scales with weather intensity", () => {
    const systemLow = new SnowAccumulationSystem();
    const tileLow = makeTile("soil");
    const worldLow = makeWorld([tileLow], "snow", -5, 0.3);

    const systemHigh = new SnowAccumulationSystem();
    const tileHigh = makeTile("soil");
    const worldHigh = makeWorld([tileHigh], "snow", -5, 1.0);

    for (let i = 0; i < SNOW_CHECK_INTERVAL; i++) {
      systemLow.update(() => worldLow);
      systemHigh.update(() => worldHigh);
    }

    expect(tileHigh.snowDepth).toBeGreaterThan(tileLow.snowDepth);
  });
});
