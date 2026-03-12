import { describe, expect, it } from "vitest";
import { createCleanJob } from "./job-factory";

describe("clean job", () => {
  it("creates a clean job with correct steps", () => {
    const job = createCleanJob("char1", { x: 5, y: 10, z: 0 }, 1);
    expect(job.type).toBe("clean");
    expect(job.characterId).toBe("char1");
    expect(job.steps).toHaveLength(3);
    expect(job.steps[0].type).toBe("move");
    expect(job.steps[1].type).toBe("work");
    expect(job.steps[2].type).toBe("clean_tile");
  });

  it("scales work ticks with filth level", () => {
    const lightFilth = createCleanJob("c1", { x: 0, y: 0, z: 0 }, 1);
    const heavyFilth = createCleanJob("c1", { x: 0, y: 0, z: 0 }, 4);

    const lightWork = lightFilth.steps[1];
    const heavyWork = heavyFilth.steps[1];
    if (lightWork.type === "work" && heavyWork.type === "work") {
      expect(heavyWork.totalTicks).toBeGreaterThan(lightWork.totalTicks);
    }
  });

  it("has minimum work ticks of 60", () => {
    const tinyFilth = createCleanJob("c1", { x: 0, y: 0, z: 0 }, 0.1);

    const work = tinyFilth.steps[1];
    if (work.type === "work") {
      expect(work.totalTicks).toBeGreaterThanOrEqual(60);
    }
  });

  it("caps work ticks at max filth level", () => {
    const maxFilth = createCleanJob("c1", { x: 0, y: 0, z: 0 }, 10);
    const capFilth = createCleanJob("c1", { x: 0, y: 0, z: 0 }, 5);

    const maxWork = maxFilth.steps[1];
    const capWork = capFilth.steps[1];
    if (maxWork.type === "work" && capWork.type === "work") {
      // filth is capped at 5 in the job factory
      expect(maxWork.totalTicks).toBe(capWork.totalTicks);
    }
  });

  it("clean_tile step targets correct position", () => {
    const pos = { x: 3, y: 7, z: 0 };
    const job = createCleanJob("c1", pos, 2);
    const cleanStep = job.steps[2];
    if (cleanStep.type === "clean_tile") {
      expect(cleanStep.position).toEqual(pos);
    }
  });

  it("move step is not adjacent (colonist walks onto tile)", () => {
    const job = createCleanJob("c1", { x: 0, y: 0, z: 0 }, 1);
    const moveStep = job.steps[0];
    if (moveStep.type === "move") {
      expect(moveStep.adjacent).toBe(false);
    }
  });
});
