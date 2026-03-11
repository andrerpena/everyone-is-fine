import { describe, expect, it } from "vitest";
import { createDeconstructJob } from "./job-factory";

describe("createDeconstructJob", () => {
  it("creates a job with correct type and steps", () => {
    const job = createDeconstructJob(
      "char_1",
      { x: 5, y: 3, z: 0 },
      "wall_wood",
    );

    expect(job.type).toBe("deconstruct");
    expect(job.characterId).toBe("char_1");
    expect(job.steps).toHaveLength(4);
    expect(job.steps[0].type).toBe("move");
    expect(job.steps[1].type).toBe("work");
    expect(job.steps[2].type).toBe("transform_tile");
    expect(job.steps[3].type).toBe("spawn_items");
  });

  it("uses 50% of construction work ticks", () => {
    // wall_wood has workTicks: 300, so deconstruct = 150
    const job = createDeconstructJob(
      "char_1",
      { x: 0, y: 0, z: 0 },
      "wall_wood",
    );
    const workStep = job.steps[1];
    if (workStep.type !== "work") throw new Error("Expected work step");
    expect(workStep.totalTicks).toBe(150);
  });

  it("enforces minimum 60 work ticks", () => {
    // chair has workTicks: 120, so 50% = 60 (exactly at minimum)
    const job = createDeconstructJob("char_1", { x: 0, y: 0, z: 0 }, "chair");
    const workStep = job.steps[1];
    if (workStep.type !== "work") throw new Error("Expected work step");
    expect(workStep.totalTicks).toBe(60);
  });

  it("recovers 75% of original materials (floor division)", () => {
    // wall_wood costs 5 wood → recovers floor(5 * 0.75) = 3 wood
    const job = createDeconstructJob(
      "char_1",
      { x: 0, y: 0, z: 0 },
      "wall_wood",
    );
    const spawnStep = job.steps[3];
    if (spawnStep.type !== "spawn_items")
      throw new Error("Expected spawn_items");
    expect(spawnStep.items).toEqual([{ type: "wood", quantity: 3 }]);
  });

  it("recovers multiple material types", () => {
    // bed costs 3 wood + 2 cloth → recovers floor(3*0.75)=2 wood + floor(2*0.75)=1 cloth
    const job = createDeconstructJob("char_1", { x: 0, y: 0, z: 0 }, "bed");
    const spawnStep = job.steps[3];
    if (spawnStep.type !== "spawn_items")
      throw new Error("Expected spawn_items");
    expect(spawnStep.items).toEqual([
      { type: "wood", quantity: 2 },
      { type: "cloth", quantity: 1 },
    ]);
  });

  it("removes the structure via transform_tile", () => {
    const job = createDeconstructJob(
      "char_1",
      { x: 3, y: 4, z: 0 },
      "wall_wood",
    );
    const transformStep = job.steps[2];
    if (transformStep.type !== "transform_tile")
      throw new Error("Expected transform_tile");
    expect(transformStep.removeStructure).toBe(true);
    expect(transformStep.position).toEqual({ x: 3, y: 4, z: 0 });
  });

  it("moves adjacent to the target", () => {
    const job = createDeconstructJob("char_1", { x: 2, y: 2, z: 0 }, "table");
    const moveStep = job.steps[0];
    if (moveStep.type !== "move") throw new Error("Expected move step");
    expect(moveStep.adjacent).toBe(true);
    expect(moveStep.destination).toEqual({ x: 2, y: 2, z: 0 });
  });
});
