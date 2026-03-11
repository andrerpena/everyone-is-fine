import { describe, expect, it } from "vitest";
import { createCookJob } from "./job-factory";

describe("createCookJob", () => {
  it("creates a job with correct type and steps", () => {
    const job = createCookJob("char_1", { x: 5, y: 3, z: 0 });

    expect(job.type).toBe("cook");
    expect(job.characterId).toBe("char_1");
    expect(job.steps).toHaveLength(3);
    expect(job.steps[0].type).toBe("move");
    expect(job.steps[1].type).toBe("work");
    expect(job.steps[2].type).toBe("spawn_items");
  });

  it("moves adjacent to the campfire", () => {
    const job = createCookJob("char_1", { x: 3, y: 4, z: 0 });
    const moveStep = job.steps[0];
    if (moveStep.type !== "move") throw new Error("Expected move step");
    expect(moveStep.adjacent).toBe(true);
    expect(moveStep.destination).toEqual({ x: 3, y: 4, z: 0 });
  });

  it("works for 180 ticks", () => {
    const job = createCookJob("char_1", { x: 0, y: 0, z: 0 });
    const workStep = job.steps[1];
    if (workStep.type !== "work") throw new Error("Expected work step");
    expect(workStep.totalTicks).toBe(180);
  });

  it("spawns a simple meal at the campfire position", () => {
    const job = createCookJob("char_1", { x: 5, y: 5, z: 0 });
    const spawnStep = job.steps[2];
    if (spawnStep.type !== "spawn_items")
      throw new Error("Expected spawn_items");
    expect(spawnStep.items).toEqual([{ type: "meal_simple", quantity: 1 }]);
    expect(spawnStep.position).toEqual({ x: 5, y: 5, z: 0 });
  });

  it("creates a pending job with generated id", () => {
    const job = createCookJob("char_1", { x: 0, y: 0, z: 0 });
    expect(job.id).toBeTruthy();
    expect(job.status).toBe("pending");
    expect(job.currentStepIndex).toBe(0);
  });
});
