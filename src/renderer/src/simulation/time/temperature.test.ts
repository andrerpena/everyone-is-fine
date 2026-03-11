import { describe, expect, it } from "vitest";
import { getOutdoorTemperature } from "./temperature";

describe("getOutdoorTemperature", () => {
  it("returns warmest at peak hour (14:00) in summer", () => {
    const temp = getOutdoorTemperature("summer", 14);
    expect(temp).toBe(30); // 25 base + 5 amplitude
  });

  it("returns coldest at 02:00 in summer", () => {
    const temp = getOutdoorTemperature("summer", 2);
    expect(temp).toBe(20); // 25 base - 5 amplitude
  });

  it("returns base temp at dawn/dusk crossover (08:00)", () => {
    const temp = getOutdoorTemperature("summer", 8);
    // 6 hours from peak → cos(6π/12) = cos(π/2) = 0
    expect(temp).toBe(25); // just the base
  });

  it("is coldest in winter", () => {
    const winterPeak = getOutdoorTemperature("winter", 14);
    const summerPeak = getOutdoorTemperature("summer", 14);
    expect(winterPeak).toBeLessThan(summerPeak);
  });

  it("winter peak is base + amplitude", () => {
    const temp = getOutdoorTemperature("winter", 14);
    expect(temp).toBe(3); // -2 base + 5 amplitude
  });

  it("winter trough is base - amplitude", () => {
    const temp = getOutdoorTemperature("winter", 2);
    expect(temp).toBe(-7); // -2 base - 5 amplitude
  });

  it("spring is moderate", () => {
    const temp = getOutdoorTemperature("spring", 14);
    expect(temp).toBe(20); // 15 base + 5 amplitude
  });

  it("autumn is moderate", () => {
    const temp = getOutdoorTemperature("autumn", 14);
    expect(temp).toBe(17); // 12 base + 5 amplitude
  });
});
