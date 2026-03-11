import { describe, expect, it } from "vitest";
import type { StructureData, Tile, World, ZLevel } from "../../world/types";
import { EntityStore } from "../entity-store";
import { MovementSystem } from "../movement";
import { createCharacter } from "../types";
import { ConstructionSystem } from "./construction-system";
import { JobProcessor } from "./job-processor";

function makeBlueprint(type: StructureData["type"]): StructureData {
  return { type, health: 100, rotation: 0 };
}

function makeTile(blueprint: StructureData | null = null): Tile {
  return {
    terrain: { type: "soil", moisture: 0.5, temperature: 20 },
    floor: null,
    structure: null,
    items: [],
    pathfinding: { isPassable: true, movementCost: 1, lastUpdated: 0 },
    visibility: { explored: false, visible: false, lightLevel: 0 },
    snowDepth: 0,
    crop: null,
    blueprint,
  };
}

function makeWorld(tiles: Tile[], width: number, height: number): World {
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
      season: "spring",
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

function makeChar(store: EntityStore, x: number, y: number) {
  const char = createCharacter({
    name: `Test-${x}-${y}`,
    position: { x, y, z: 0 },
  });
  store.add(char);
  return char;
}

describe("ConstructionSystem", () => {
  it("does nothing before CHECK_INTERVAL ticks", () => {
    const entityStore = new EntityStore();
    const movementSystem = new MovementSystem(entityStore, () => 1);
    const jobProcessor = new JobProcessor(
      entityStore,
      movementSystem,
      () => null,
      () => {},
    );
    const system = new ConstructionSystem(
      entityStore,
      jobProcessor,
      () => null,
    );

    // Tick 119 times (interval is 120)
    for (let i = 0; i < 119; i++) {
      system.update();
    }

    // No jobs should be assigned since interval hasn't elapsed
    expect(jobProcessor.getActiveJobProgress().size).toBe(0);
  });

  it("assigns build job when blueprint exists and colonist is idle", () => {
    const entityStore = new EntityStore();
    const movementSystem = new MovementSystem(entityStore, () => 1);

    // 3x3 world, blueprint at (1,1)
    const tiles: Tile[] = [];
    for (let i = 0; i < 9; i++) {
      tiles.push(makeTile());
    }
    tiles[4] = makeTile(makeBlueprint("wall_wood")); // (1,1)

    const world = makeWorld(tiles, 3, 3);
    const jobProcessor = new JobProcessor(
      entityStore,
      movementSystem,
      () => world,
      () => {},
    );
    const system = new ConstructionSystem(
      entityStore,
      jobProcessor,
      () => world,
    );

    // Add idle colonist at (0,0)
    const char = makeChar(entityStore, 0, 0);

    // Tick 120 times to trigger scan
    for (let i = 0; i < 120; i++) {
      system.update();
    }

    // Job should be assigned
    const job = jobProcessor.getJob(char.id);
    expect(job).toBeDefined();
    expect(job?.type).toBe("build");
    expect(job?.targetPosition).toEqual({ x: 1, y: 1, z: 0 });
  });

  it("skips tiles that already have a structure", () => {
    const entityStore = new EntityStore();
    const movementSystem = new MovementSystem(entityStore, () => 1);

    const tiles: Tile[] = [];
    for (let i = 0; i < 4; i++) {
      tiles.push(makeTile());
    }
    // Tile (1,0) has both blueprint AND structure — should be skipped
    tiles[1] = {
      ...makeTile(makeBlueprint("wall_wood")),
      structure: { type: "wall_wood", health: 100, rotation: 0 },
    };

    const world = makeWorld(tiles, 2, 2);
    const jobProcessor = new JobProcessor(
      entityStore,
      movementSystem,
      () => world,
      () => {},
    );
    const system = new ConstructionSystem(
      entityStore,
      jobProcessor,
      () => world,
    );

    makeChar(entityStore, 0, 0);

    for (let i = 0; i < 120; i++) {
      system.update();
    }

    // No jobs — all blueprints either absent or already built
    expect(jobProcessor.getActiveJobProgress().size).toBe(0);
  });

  it("does not assign jobs to drafted colonists", () => {
    const entityStore = new EntityStore();
    const movementSystem = new MovementSystem(entityStore, () => 1);

    const tiles: Tile[] = [];
    for (let i = 0; i < 4; i++) {
      tiles.push(makeTile());
    }
    tiles[1] = makeTile(makeBlueprint("wall_wood"));

    const world = makeWorld(tiles, 2, 2);
    const jobProcessor = new JobProcessor(
      entityStore,
      movementSystem,
      () => world,
      () => {},
    );
    const system = new ConstructionSystem(
      entityStore,
      jobProcessor,
      () => world,
    );

    const char = makeChar(entityStore, 0, 0);
    // Draft the colonist
    entityStore.update(char.id, {
      control: { ...char.control, mode: "drafted" },
    });

    for (let i = 0; i < 120; i++) {
      system.update();
    }

    expect(jobProcessor.getJob(char.id)).toBeUndefined();
  });
});
