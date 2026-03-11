import { describe, expect, it } from "vitest";
import { createSleepJob } from "../jobs/job-factory";
import { createCharacter } from "../types";
import { NEED_CONFIGS } from "./needs-config";

describe("comfort need", () => {
  it("is included in NEED_CONFIGS with correct decay rate", () => {
    const comfortConfig = NEED_CONFIGS.find((c) => c.id === "comfort");
    expect(comfortConfig).toBeDefined();
    expect(comfortConfig!.decayPerSecond).toBe(0.0005);
    expect(comfortConfig!.label).toBe("Comfort");
  });

  it("starts at 1.0 for new characters", () => {
    const char = createCharacter({
      name: "Test",
      position: { x: 0, y: 0, z: 0 },
    });
    expect(char.needs.comfort).toBe(1);
  });

  it("decays slower than hunger and energy", () => {
    const hunger = NEED_CONFIGS.find((c) => c.id === "hunger")!;
    const energy = NEED_CONFIGS.find((c) => c.id === "energy")!;
    const comfort = NEED_CONFIGS.find((c) => c.id === "comfort")!;

    expect(comfort.decayPerSecond).toBeLessThan(hunger.decayPerSecond);
    expect(comfort.decayPerSecond).toBeLessThan(energy.decayPerSecond);
  });
});

describe("createSleepJob with comfort", () => {
  it("restores comfort 0.15 when sleeping on the ground", () => {
    const job = createSleepJob("char_1", { x: 0, y: 0, z: 0 }, false);
    const comfortStep = job.steps.find(
      (s) => s.type === "restore_need" && s.needId === "comfort",
    );
    expect(comfortStep).toBeDefined();
    if (comfortStep?.type !== "restore_need")
      throw new Error("Expected restore_need");
    expect(comfortStep.amount).toBe(0.15);
  });

  it("restores comfort 0.4 when sleeping on a bed", () => {
    const job = createSleepJob("char_1", { x: 5, y: 5, z: 0 }, true);
    const comfortStep = job.steps.find(
      (s) => s.type === "restore_need" && s.needId === "comfort",
    );
    expect(comfortStep).toBeDefined();
    if (comfortStep?.type !== "restore_need")
      throw new Error("Expected restore_need");
    expect(comfortStep.amount).toBe(0.4);
  });

  it("includes move step when sleeping on a bed", () => {
    const job = createSleepJob("char_1", { x: 5, y: 5, z: 0 }, true);
    expect(job.steps[0].type).toBe("move");
  });

  it("has no move step when sleeping on ground", () => {
    const job = createSleepJob("char_1", { x: 0, y: 0, z: 0 }, false);
    expect(job.steps[0].type).toBe("work");
  });

  it("restores energy in both ground and bed sleep", () => {
    const groundJob = createSleepJob("char_1", { x: 0, y: 0, z: 0 }, false);
    const bedJob = createSleepJob("char_1", { x: 5, y: 5, z: 0 }, true);

    const groundEnergy = groundJob.steps.find(
      (s) => s.type === "restore_need" && s.needId === "energy",
    );
    const bedEnergy = bedJob.steps.find(
      (s) => s.type === "restore_need" && s.needId === "energy",
    );

    expect(groundEnergy).toBeDefined();
    expect(bedEnergy).toBeDefined();
  });

  it("defaults to ground sleep when onBed is omitted", () => {
    const job = createSleepJob("char_1", { x: 0, y: 0, z: 0 });
    expect(job.steps[0].type).toBe("work");
    const comfortStep = job.steps.find(
      (s) => s.type === "restore_need" && s.needId === "comfort",
    );
    if (comfortStep?.type !== "restore_need")
      throw new Error("Expected restore_need");
    expect(comfortStep.amount).toBe(0.15);
  });
});
