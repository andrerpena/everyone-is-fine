import { describe, expect, it } from "vitest";
import { TERRAIN_REGISTRY } from "../../world/registries/terrain-registry";
import { createMineTerrainJob } from "./job-factory";

describe("createMineTerrainJob", () => {
  it("creates a job with correct type and steps", () => {
    const job = createMineTerrainJob("char_1", { x: 5, y: 3, z: 0 }, "rock");

    expect(job.type).toBe("mine_terrain");
    expect(job.characterId).toBe("char_1");
    expect(job.steps).toHaveLength(4);
    expect(job.steps[0].type).toBe("move");
    expect(job.steps[1].type).toBe("work");
    expect(job.steps[2].type).toBe("transform_tile");
    expect(job.steps[3].type).toBe("spawn_items");
  });

  it("moves adjacent to the target", () => {
    const job = createMineTerrainJob("char_1", { x: 2, y: 2, z: 0 }, "rock");
    const moveStep = job.steps[0];
    if (moveStep.type !== "move") throw new Error("Expected move step");
    expect(moveStep.adjacent).toBe(true);
    expect(moveStep.destination).toEqual({ x: 2, y: 2, z: 0 });
  });

  it("scales work ticks with terrain hardness", () => {
    const rockJob = createMineTerrainJob(
      "char_1",
      { x: 0, y: 0, z: 0 },
      "rock",
    );
    const graniteJob = createMineTerrainJob(
      "char_1",
      { x: 0, y: 0, z: 0 },
      "granite",
    );

    const rockWork = rockJob.steps[1];
    const graniteWork = graniteJob.steps[1];
    if (rockWork.type !== "work" || graniteWork.type !== "work")
      throw new Error("Expected work steps");

    // Granite (hardness 0.95) should take longer than rock (hardness 0.8)
    expect(graniteWork.totalTicks).toBeGreaterThan(rockWork.totalTicks);
  });

  it("transforms terrain to gravel", () => {
    const job = createMineTerrainJob("char_1", { x: 3, y: 4, z: 0 }, "marble");
    const transformStep = job.steps[2];
    if (transformStep.type !== "transform_tile")
      throw new Error("Expected transform_tile");
    expect(transformStep.newTerrain).toBe("gravel");
    expect(transformStep.position).toEqual({ x: 3, y: 4, z: 0 });
  });

  it("spawns stone items", () => {
    const job = createMineTerrainJob("char_1", { x: 0, y: 0, z: 0 }, "rock");
    const spawnStep = job.steps[3];
    if (spawnStep.type !== "spawn_items")
      throw new Error("Expected spawn_items");
    expect(spawnStep.items[0].type).toBe("stone");
    expect(spawnStep.items[0].quantity).toBeGreaterThan(0);
  });

  it("yields more stone from harder terrain", () => {
    const rockJob = createMineTerrainJob(
      "char_1",
      { x: 0, y: 0, z: 0 },
      "rock",
    );
    const obsidianJob = createMineTerrainJob(
      "char_1",
      { x: 0, y: 0, z: 0 },
      "obsidian",
    );

    const rockSpawn = rockJob.steps[3];
    const obsidianSpawn = obsidianJob.steps[3];
    if (
      rockSpawn.type !== "spawn_items" ||
      obsidianSpawn.type !== "spawn_items"
    )
      throw new Error("Expected spawn_items");

    // Obsidian (hardness 1.0) yields more than rock (hardness 0.8)
    expect(obsidianSpawn.items[0].quantity).toBeGreaterThan(
      rockSpawn.items[0].quantity,
    );
  });

  it("uses correct work ticks formula", () => {
    // Formula: round(360 * (0.5 + hardness))
    // Rock hardness = 0.8 → round(360 * 1.3) = 468
    const job = createMineTerrainJob("char_1", { x: 0, y: 0, z: 0 }, "rock");
    const workStep = job.steps[1];
    if (workStep.type !== "work") throw new Error("Expected work step");
    const expected = Math.round(360 * (0.5 + TERRAIN_REGISTRY.rock.hardness));
    expect(workStep.totalTicks).toBe(expected);
  });
});
