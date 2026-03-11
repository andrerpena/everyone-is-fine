import { describe, expect, it } from "vitest";
import { createRelaxJob } from "../jobs/job-factory";
import { createCharacter } from "../types";
import { getNeedThreshold, NEED_CONFIGS } from "./needs-config";

describe("recreation need", () => {
  it("is included in NEED_CONFIGS with correct decay rate", () => {
    const config = NEED_CONFIGS.find((c) => c.id === "recreation");
    expect(config).toBeDefined();
    expect(config!.decayPerSecond).toBe(0.0004);
    expect(config!.label).toBe("Recreation");
  });

  it("defaults to 1 in createCharacter", () => {
    const char = createCharacter({
      name: "Test",
      position: { x: 0, y: 0, z: 0 },
    });
    expect(char.needs.recreation).toBe(1);
  });

  it("threshold is satisfied at full", () => {
    expect(getNeedThreshold(1)).toBe("satisfied");
  });

  it("threshold is critical at 0", () => {
    expect(getNeedThreshold(0)).toBe("critical");
  });

  it("threshold is minor when moderately low", () => {
    expect(getNeedThreshold(0.45)).toBe("minor");
  });
});

describe("createRelaxJob", () => {
  it("creates a job with correct type and steps", () => {
    const job = createRelaxJob("char_1", { x: 5, y: 3, z: 0 });

    expect(job.type).toBe("relax");
    expect(job.characterId).toBe("char_1");
    expect(job.steps).toHaveLength(3);
    expect(job.steps[0].type).toBe("move");
    expect(job.steps[1].type).toBe("work");
    expect(job.steps[2].type).toBe("restore_need");
  });

  it("moves to the target position", () => {
    const job = createRelaxJob("char_1", { x: 3, y: 4, z: 0 });
    const moveStep = job.steps[0];
    if (moveStep.type !== "move") throw new Error("Expected move step");
    expect(moveStep.adjacent).toBe(false);
    expect(moveStep.destination).toEqual({ x: 3, y: 4, z: 0 });
  });

  it("idles for 300 ticks", () => {
    const job = createRelaxJob("char_1", { x: 0, y: 0, z: 0 });
    const workStep = job.steps[1];
    if (workStep.type !== "work") throw new Error("Expected work step");
    expect(workStep.totalTicks).toBe(300);
  });

  it("restores 0.3 recreation", () => {
    const job = createRelaxJob("char_1", { x: 0, y: 0, z: 0 });
    const restoreStep = job.steps[2];
    if (restoreStep.type !== "restore_need")
      throw new Error("Expected restore_need step");
    expect(restoreStep.needId).toBe("recreation");
    expect(restoreStep.amount).toBe(0.3);
  });

  it("creates a pending job with generated id", () => {
    const job = createRelaxJob("char_1", { x: 0, y: 0, z: 0 });
    expect(job.id).toBeTruthy();
    expect(job.status).toBe("pending");
    expect(job.currentStepIndex).toBe(0);
  });
});
