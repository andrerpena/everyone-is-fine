import { describe, expect, it } from "vitest";
import { createSmoothJob, isSmoothable } from "./job-factory";

describe("smoothing job", () => {
  describe("isSmoothable", () => {
    it("returns true for rock terrain types", () => {
      expect(isSmoothable("rock")).toBe(true);
      expect(isSmoothable("granite")).toBe(true);
      expect(isSmoothable("limestone")).toBe(true);
      expect(isSmoothable("marble")).toBe(true);
      expect(isSmoothable("obsidian")).toBe(true);
    });

    it("returns false for non-rock terrain types", () => {
      expect(isSmoothable("soil")).toBe(false);
      expect(isSmoothable("sand")).toBe(false);
      expect(isSmoothable("clay")).toBe(false);
      expect(isSmoothable("gravel")).toBe(false);
      expect(isSmoothable("water_shallow")).toBe(false);
      expect(isSmoothable("water_deep")).toBe(false);
      expect(isSmoothable("void")).toBe(false);
    });
  });

  describe("createSmoothJob", () => {
    it("creates a smooth job with correct steps", () => {
      const job = createSmoothJob("char1", { x: 5, y: 10, z: 0 }, "granite");
      expect(job.type).toBe("smooth");
      expect(job.characterId).toBe("char1");
      expect(job.steps).toHaveLength(3);
      expect(job.steps[0].type).toBe("move");
      expect(job.steps[1].type).toBe("work");
      expect(job.steps[2].type).toBe("place_floor");
    });

    it("places stone_smooth floor type", () => {
      const job = createSmoothJob("char1", { x: 0, y: 0, z: 0 }, "rock");
      const floorStep = job.steps[2];
      expect(floorStep.type).toBe("place_floor");
      if (floorStep.type === "place_floor") {
        expect(floorStep.floorType).toBe("stone_smooth");
      }
    });

    it("scales work ticks with terrain hardness", () => {
      const rockJob = createSmoothJob("c1", { x: 0, y: 0, z: 0 }, "rock");
      const graniteJob = createSmoothJob("c1", { x: 0, y: 0, z: 0 }, "granite");

      const rockWork = rockJob.steps[1];
      const graniteWork = graniteJob.steps[1];
      if (rockWork.type === "work" && graniteWork.type === "work") {
        // granite (0.95 hardness) should take more work than rock (0.8)
        expect(graniteWork.totalTicks).toBeGreaterThan(rockWork.totalTicks);
      }
    });
  });
});
