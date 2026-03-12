import { describe, expect, it } from "vitest";
import {
  DEFAULT_INSULATION,
  getIndoorTemperature,
  INDOOR_COMFORT_BASELINE,
} from "./indoor-temperature";

describe("getIndoorTemperature", () => {
  it("returns comfort baseline when outdoor matches baseline", () => {
    expect(getIndoorTemperature(INDOOR_COMFORT_BASELINE)).toBe(
      INDOOR_COMFORT_BASELINE,
    );
  });

  it("moderates hot outdoor temperature toward baseline", () => {
    // Outdoor 30°C with default 0.5 insulation → 25°C
    const indoor = getIndoorTemperature(30);
    expect(indoor).toBe(25);
    expect(indoor).toBeLessThan(30);
    expect(indoor).toBeGreaterThan(INDOOR_COMFORT_BASELINE);
  });

  it("moderates cold outdoor temperature toward baseline", () => {
    // Outdoor -10°C with default 0.5 insulation → 5°C
    const indoor = getIndoorTemperature(-10);
    expect(indoor).toBe(5);
    expect(indoor).toBeGreaterThan(-10);
    expect(indoor).toBeLessThan(INDOOR_COMFORT_BASELINE);
  });

  it("with zero insulation, indoor equals outdoor", () => {
    expect(getIndoorTemperature(35, 0)).toBe(35);
    expect(getIndoorTemperature(-20, 0)).toBe(-20);
  });

  it("with perfect insulation, indoor equals baseline", () => {
    expect(getIndoorTemperature(35, 1)).toBe(INDOOR_COMFORT_BASELINE);
    expect(getIndoorTemperature(-20, 1)).toBe(INDOOR_COMFORT_BASELINE);
  });

  it("default insulation is 0.5", () => {
    expect(DEFAULT_INSULATION).toBe(0.5);
  });

  it("rounds to 1 decimal place", () => {
    // 15°C outdoor: 15 + 0.5 * (20 - 15) = 17.5
    const indoor = getIndoorTemperature(15);
    expect(indoor).toBe(17.5);
    expect(indoor.toString().split(".")[1]?.length ?? 0).toBeLessThanOrEqual(1);
  });

  it("handles extreme temperatures", () => {
    // -40°C outdoor: -40 + 0.5 * (20 - (-40)) = -40 + 30 = -10
    expect(getIndoorTemperature(-40)).toBe(-10);
    // 50°C outdoor: 50 + 0.5 * (20 - 50) = 50 - 15 = 35
    expect(getIndoorTemperature(50)).toBe(35);
  });
});
