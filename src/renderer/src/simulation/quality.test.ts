import { describe, expect, it } from "vitest";
import { calculateQualityFromSkill, getQualityLabel } from "./quality";

describe("calculateQualityFromSkill", () => {
  it("returns quality in [0, 1] range for skill 0", () => {
    for (let i = 0; i < 50; i++) {
      const q = calculateQualityFromSkill(0);
      expect(q).toBeGreaterThanOrEqual(0);
      expect(q).toBeLessThanOrEqual(1);
    }
  });

  it("returns quality in [0, 1] range for skill 20", () => {
    for (let i = 0; i < 50; i++) {
      const q = calculateQualityFromSkill(20);
      expect(q).toBeGreaterThanOrEqual(0);
      expect(q).toBeLessThanOrEqual(1);
    }
  });

  it("higher skill produces higher average quality", () => {
    let lowSkillSum = 0;
    let highSkillSum = 0;
    const iterations = 200;

    for (let i = 0; i < iterations; i++) {
      lowSkillSum += calculateQualityFromSkill(0);
      highSkillSum += calculateQualityFromSkill(20);
    }

    const lowAvg = lowSkillSum / iterations;
    const highAvg = highSkillSum / iterations;
    expect(highAvg).toBeGreaterThan(lowAvg);
  });

  it("skill 10 produces roughly normal quality (around 0.5)", () => {
    let sum = 0;
    const iterations = 200;

    for (let i = 0; i < iterations; i++) {
      sum += calculateQualityFromSkill(10);
    }

    const avg = sum / iterations;
    expect(avg).toBeGreaterThan(0.35);
    expect(avg).toBeLessThan(0.65);
  });
});

describe("getQualityLabel", () => {
  it("returns Awful for very low quality", () => {
    expect(getQualityLabel(0.1)).toBe("Awful");
  });

  it("returns Poor for low quality", () => {
    expect(getQualityLabel(0.3)).toBe("Poor");
  });

  it("returns Normal for mid quality", () => {
    expect(getQualityLabel(0.5)).toBe("Normal");
  });

  it("returns Good for high quality", () => {
    expect(getQualityLabel(0.7)).toBe("Good");
  });

  it("returns Excellent for very high quality", () => {
    expect(getQualityLabel(0.9)).toBe("Excellent");
  });

  it("returns Masterwork for near-perfect quality", () => {
    expect(getQualityLabel(0.96)).toBe("Masterwork");
    expect(getQualityLabel(1.0)).toBe("Masterwork");
  });

  it("returns Awful at boundary 0", () => {
    expect(getQualityLabel(0)).toBe("Awful");
  });
});
