import { describe, expect, it } from "vitest";
import { STRUCTURE_REGISTRY } from "../../world/registries/structure-registry";
import { createRepairJob } from "./job-factory";

describe("repair job", () => {
  it("creates a repair job with correct steps", () => {
    const job = createRepairJob(
      "char1",
      { x: 5, y: 10, z: 0 },
      "wall_stone",
      100,
    );
    expect(job.type).toBe("repair");
    expect(job.characterId).toBe("char1");
    expect(job.steps).toHaveLength(3);
    expect(job.steps[0].type).toBe("move");
    expect(job.steps[1].type).toBe("work");
    expect(job.steps[2].type).toBe("repair_structure");
  });

  it("scales work ticks with damage amount", () => {
    const maxHealth = STRUCTURE_REGISTRY.wall_stone.maxHealth;
    const lightDamage = createRepairJob(
      "c1",
      { x: 0, y: 0, z: 0 },
      "wall_stone",
      maxHealth - 50,
    );
    const heavyDamage = createRepairJob(
      "c1",
      { x: 0, y: 0, z: 0 },
      "wall_stone",
      50,
    );

    const lightWork = lightDamage.steps[1];
    const heavyWork = heavyDamage.steps[1];
    if (lightWork.type === "work" && heavyWork.type === "work") {
      expect(heavyWork.totalTicks).toBeGreaterThan(lightWork.totalTicks);
    }
  });

  it("has minimum work ticks of 60", () => {
    const maxHealth = STRUCTURE_REGISTRY.wall_stone.maxHealth;
    const tinyDamage = createRepairJob(
      "c1",
      { x: 0, y: 0, z: 0 },
      "wall_stone",
      maxHealth - 1,
    );

    const work = tinyDamage.steps[1];
    if (work.type === "work") {
      expect(work.totalTicks).toBeGreaterThanOrEqual(60);
    }
  });

  it("repair_structure step targets correct position", () => {
    const pos = { x: 3, y: 7, z: 0 };
    const job = createRepairJob("c1", pos, "door_wood", 50);
    const repairStep = job.steps[2];
    if (repairStep.type === "repair_structure") {
      expect(repairStep.position).toEqual(pos);
    }
  });
});
