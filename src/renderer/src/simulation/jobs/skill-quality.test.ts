import { describe, expect, it } from "vitest";
import { createCookJob, createHarvestJob, createMineJob } from "./job-factory";

describe("skill-based item quality in jobs", () => {
  describe("createCookJob", () => {
    it("includes skillId cooking on the spawn_items step", () => {
      const job = createCookJob("char_1", { x: 5, y: 3, z: 0 });
      const spawnStep = job.steps.find((s) => s.type === "spawn_items");
      expect(spawnStep).toBeDefined();
      if (spawnStep?.type !== "spawn_items")
        throw new Error("Expected spawn_items step");
      expect(spawnStep.skillId).toBe("cooking");
    });
  });

  describe("createHarvestJob", () => {
    it("uses harvest_crop step (quality handled in job processor)", () => {
      const job = createHarvestJob("char_1", { x: 3, y: 4, z: 0 }, "rice");
      const harvestStep = job.steps.find((s) => s.type === "harvest_crop");
      expect(harvestStep).toBeDefined();
    });
  });

  describe("SpawnItemsStep skillId", () => {
    it("cook job spawn step has skillId", () => {
      const job = createCookJob("char_1", { x: 0, y: 0, z: 0 });
      const spawnStep = job.steps[2];
      if (spawnStep.type !== "spawn_items")
        throw new Error("Expected spawn_items");
      expect(spawnStep.skillId).toBe("cooking");
      expect(spawnStep.items).toEqual([{ type: "meal_simple", quantity: 1 }]);
    });

    it("jobs without skillId default to no skillId", () => {
      // Mine jobs spawn items without skillId (raw resources don't need quality variance)
      const job = createMineJob("char_1", { x: 0, y: 0, z: 0 });
      const spawnStep = job.steps.find((s) => s.type === "spawn_items");
      if (spawnStep && spawnStep.type === "spawn_items") {
        expect(spawnStep.skillId).toBeUndefined();
      }
    });
  });
});
