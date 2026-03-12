import { describe, expect, it } from "vitest";
import type { Tile, World, ZLevel } from "../../world/types";
import { EntityStore } from "../entity-store";
import { createCharacter } from "../types";
import {
  SIGHT_RADIUS,
  VISION_CHECK_INTERVAL,
  VisionSystem,
} from "./vision-system";

function makeTile(): Tile {
  return {
    terrain: { type: "soil", moisture: 0.5, temperature: 20 },
    floor: null,
    structure: null,
    items: [],
    pathfinding: { isPassable: true, movementCost: 1, lastUpdated: 0 },
    visibility: { explored: false, visible: false, lightLevel: 0 },
    snowDepth: 0,
    filth: 0,
    crop: null,
    blueprint: null,
  };
}

function makeWorld(width: number, height: number): World {
  const tiles: Tile[] = [];
  for (let i = 0; i < width * height; i++) {
    tiles.push(makeTile());
  }

  const level: ZLevel = {
    z: 0,
    width,
    height,
    tiles,
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
    dimensions: { width, height, minZ: 0, maxZ: 0 },
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
      temperature: 20,
      windSpeed: 0,
      windDirection: 0,
    },
  };
}

function makeChar(x: number, y: number, z = 0) {
  return createCharacter({
    name: "Test",
    position: { x, y, z },
  });
}

function runTicks(system: VisionSystem, world: World, count: number) {
  for (let i = 0; i < count; i++) {
    system.update(() => world);
  }
}

describe("VisionSystem", () => {
  it("does nothing before CHECK_INTERVAL ticks", () => {
    const entityStore = new EntityStore();
    const system = new VisionSystem(entityStore);
    const world = makeWorld(10, 10);

    const char = makeChar(5, 5);
    entityStore.add(char);

    runTicks(system, world, VISION_CHECK_INTERVAL - 1);

    // No tiles should be explored yet
    const level = world.levels.get(0)!;
    const explored = level.tiles.filter((t) => t.visibility.explored);
    expect(explored.length).toBe(0);
  });

  it("marks tiles near colonist as visible and explored", () => {
    const entityStore = new EntityStore();
    const system = new VisionSystem(entityStore);
    const world = makeWorld(30, 30);

    const char = makeChar(15, 15);
    entityStore.add(char);

    runTicks(system, world, VISION_CHECK_INTERVAL);

    const level = world.levels.get(0)!;
    // The colonist's own tile should be visible
    const centerTile = level.tiles[15 * 30 + 15];
    expect(centerTile.visibility.visible).toBe(true);
    expect(centerTile.visibility.explored).toBe(true);

    // A tile far away should remain unexplored
    const farTile = level.tiles[0]; // (0,0) is far from (15,15)
    expect(farTile.visibility.visible).toBe(false);
    expect(farTile.visibility.explored).toBe(false);
  });

  it("explored tiles stay explored when colonist moves away", () => {
    const entityStore = new EntityStore();
    const system = new VisionSystem(entityStore);
    const world = makeWorld(40, 40);

    const char = makeChar(5, 5);
    entityStore.add(char);

    // First update: marks tiles near (5,5) as explored
    runTicks(system, world, VISION_CHECK_INTERVAL);

    const level = world.levels.get(0)!;
    const nearTile = level.tiles[5 * 40 + 5];
    expect(nearTile.visibility.explored).toBe(true);

    // Move colonist far away
    entityStore.update(char.id, { position: { x: 35, y: 35, z: 0 } });

    // Second update: old tiles should be explored but not visible
    runTicks(system, world, VISION_CHECK_INTERVAL);

    expect(nearTile.visibility.explored).toBe(true);
    expect(nearTile.visibility.visible).toBe(false);
  });

  it("respects sight radius boundary", () => {
    const entityStore = new EntityStore();
    const system = new VisionSystem(entityStore);
    const size = SIGHT_RADIUS * 3;
    const world = makeWorld(size, size);

    const cx = Math.floor(size / 2);
    const cy = Math.floor(size / 2);
    const char = makeChar(cx, cy);
    entityStore.add(char);

    runTicks(system, world, VISION_CHECK_INTERVAL);

    const level = world.levels.get(0)!;

    // Tile exactly at sight radius (along x-axis) should be visible
    const atRadius = level.tiles[cy * size + (cx + SIGHT_RADIUS)];
    expect(atRadius.visibility.visible).toBe(true);

    // Tile just beyond sight radius should not be visible
    if (cx + SIGHT_RADIUS + 1 < size) {
      const beyond = level.tiles[cy * size + (cx + SIGHT_RADIUS + 1)];
      expect(beyond.visibility.visible).toBe(false);
    }
  });

  it("multiple colonists combine their vision", () => {
    const entityStore = new EntityStore();
    const system = new VisionSystem(entityStore);
    const world = makeWorld(50, 10);

    const char1 = makeChar(5, 5);
    const char2 = makeChar(45, 5);
    entityStore.add(char1);
    entityStore.add(char2);

    runTicks(system, world, VISION_CHECK_INTERVAL);

    const level = world.levels.get(0)!;
    // Both colonist positions should be visible
    expect(level.tiles[5 * 50 + 5].visibility.visible).toBe(true);
    expect(level.tiles[5 * 50 + 45].visibility.visible).toBe(true);

    // Middle tile (25,5) is far from both — should not be visible
    expect(level.tiles[5 * 50 + 25].visibility.visible).toBe(false);
  });
});
