import { describe, expect, it } from "vitest";
import { createBuildFloorJob } from "./job-factory";

describe("createBuildFloorJob", () => {
  it("creates a job with correct type and steps", () => {
    const job = createBuildFloorJob(
      "char_1",
      { x: 5, y: 3, z: 0 },
      "wood_plank",
    );

    expect(job.type).toBe("build_floor");
    expect(job.characterId).toBe("char_1");
    expect(job.steps).toHaveLength(3);
    expect(job.steps[0].type).toBe("move");
    expect(job.steps[1].type).toBe("work");
    expect(job.steps[2].type).toBe("place_floor");
  });

  it("uses work ticks from floor construction registry", () => {
    // wood_plank has workTicks: 120
    const job = createBuildFloorJob(
      "char_1",
      { x: 0, y: 0, z: 0 },
      "wood_plank",
    );
    const workStep = job.steps[1];
    if (workStep.type !== "work") throw new Error("Expected work step");
    expect(workStep.totalTicks).toBe(120);
  });

  it("uses correct work ticks for stone_tile", () => {
    // stone_tile has workTicks: 150
    const job = createBuildFloorJob(
      "char_1",
      { x: 0, y: 0, z: 0 },
      "stone_tile",
    );
    const workStep = job.steps[1];
    if (workStep.type !== "work") throw new Error("Expected work step");
    expect(workStep.totalTicks).toBe(150);
  });

  it("sets the correct floor type in place_floor step", () => {
    const job = createBuildFloorJob(
      "char_1",
      { x: 3, y: 4, z: 0 },
      "marble_tile",
    );
    const placeStep = job.steps[2];
    if (placeStep.type !== "place_floor")
      throw new Error("Expected place_floor step");
    expect(placeStep.floorType).toBe("marble_tile");
    expect(placeStep.position).toEqual({ x: 3, y: 4, z: 0 });
  });

  it("moves directly to the tile (not adjacent)", () => {
    const job = createBuildFloorJob(
      "char_1",
      { x: 2, y: 2, z: 0 },
      "wood_plank",
    );
    const moveStep = job.steps[0];
    if (moveStep.type !== "move") throw new Error("Expected move step");
    expect(moveStep.adjacent).toBe(false);
    expect(moveStep.destination).toEqual({ x: 2, y: 2, z: 0 });
  });

  it("defaults to 120 work ticks for unknown floor type", () => {
    // "none" is not in FLOOR_CONSTRUCTION_REGISTRY
    const job = createBuildFloorJob(
      "char_1",
      { x: 0, y: 0, z: 0 },
      "none" as any,
    );
    const workStep = job.steps[1];
    if (workStep.type !== "work") throw new Error("Expected work step");
    expect(workStep.totalTicks).toBe(120);
  });

  it("creates a pending job with generated id", () => {
    const job = createBuildFloorJob("char_1", { x: 0, y: 0, z: 0 }, "carpet");
    expect(job.id).toBeTruthy();
    expect(job.status).toBe("pending");
    expect(job.currentStepIndex).toBe(0);
  });
});
