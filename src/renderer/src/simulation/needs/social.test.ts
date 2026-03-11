import { describe, expect, it } from "vitest";
import { createSocializeJob } from "../jobs/job-factory";
import { createCharacter } from "../types";
import { NEED_CONFIGS } from "./needs-config";

describe("social need", () => {
  it("is included in NEED_CONFIGS with correct decay rate", () => {
    const config = NEED_CONFIGS.find((c) => c.id === "social");
    expect(config).toBeDefined();
    expect(config!.decayPerSecond).toBe(0.0003);
    expect(config!.label).toBe("Social");
  });

  it("defaults to 1 in createCharacter", () => {
    const char = createCharacter({
      name: "Test",
      position: { x: 0, y: 0, z: 0 },
    });
    expect(char.needs.social).toBe(1);
  });
});

describe("createSocializeJob", () => {
  it("creates a job with correct type and steps", () => {
    const job = createSocializeJob("char_1", { x: 5, y: 3, z: 0 });

    expect(job.type).toBe("socialize");
    expect(job.characterId).toBe("char_1");
    expect(job.steps).toHaveLength(3);
    expect(job.steps[0].type).toBe("move");
    expect(job.steps[1].type).toBe("work");
    expect(job.steps[2].type).toBe("restore_need");
  });

  it("moves adjacent to the target colonist", () => {
    const job = createSocializeJob("char_1", { x: 3, y: 4, z: 0 });
    const moveStep = job.steps[0];
    if (moveStep.type !== "move") throw new Error("Expected move step");
    expect(moveStep.adjacent).toBe(true);
    expect(moveStep.destination).toEqual({ x: 3, y: 4, z: 0 });
  });

  it("chats for 200 ticks", () => {
    const job = createSocializeJob("char_1", { x: 0, y: 0, z: 0 });
    const workStep = job.steps[1];
    if (workStep.type !== "work") throw new Error("Expected work step");
    expect(workStep.totalTicks).toBe(200);
  });

  it("restores 0.35 social", () => {
    const job = createSocializeJob("char_1", { x: 0, y: 0, z: 0 });
    const restoreStep = job.steps[2];
    if (restoreStep.type !== "restore_need")
      throw new Error("Expected restore_need step");
    expect(restoreStep.needId).toBe("social");
    expect(restoreStep.amount).toBe(0.35);
  });

  it("creates a pending job with generated id", () => {
    const job = createSocializeJob("char_1", { x: 0, y: 0, z: 0 });
    expect(job.id).toBeTruthy();
    expect(job.status).toBe("pending");
    expect(job.currentStepIndex).toBe(0);
  });
});
