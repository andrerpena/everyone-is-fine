// =============================================================================
// AMBIENT LIGHTING TESTS
// =============================================================================

import { describe, expect, it } from "vitest";
import { getAmbientLighting } from "./ambient-lighting";

describe("getAmbientLighting", () => {
  it("returns zero alpha during midday hours (7-16)", () => {
    for (let hour = 7; hour <= 16; hour++) {
      const lighting = getAmbientLighting(hour);
      expect(lighting.alpha).toBe(0);
    }
  });

  it("returns high alpha during deep night (0-3)", () => {
    for (let hour = 0; hour <= 3; hour++) {
      const lighting = getAmbientLighting(hour);
      expect(lighting.alpha).toBeGreaterThanOrEqual(0.45);
    }
  });

  it("returns moderate alpha during dawn (5-6)", () => {
    const dawn5 = getAmbientLighting(5);
    const dawn6 = getAmbientLighting(6);
    expect(dawn5.alpha).toBeGreaterThan(0);
    expect(dawn5.alpha).toBeLessThan(0.45);
    expect(dawn6.alpha).toBeGreaterThan(0);
    expect(dawn6.alpha).toBeLessThan(dawn5.alpha);
  });

  it("returns increasing alpha during evening (17-19)", () => {
    const e17 = getAmbientLighting(17);
    const e18 = getAmbientLighting(18);
    const e19 = getAmbientLighting(19);
    expect(e17.alpha).toBeLessThan(e18.alpha);
    expect(e18.alpha).toBeLessThan(e19.alpha);
  });

  it("returns increasing alpha during dusk (20-21)", () => {
    const d20 = getAmbientLighting(20);
    const d21 = getAmbientLighting(21);
    expect(d20.alpha).toBeLessThan(d21.alpha);
    expect(d21.alpha).toBeGreaterThanOrEqual(0.35);
  });

  it("clamps out-of-range hours", () => {
    const negativeHour = getAmbientLighting(-1);
    expect(negativeHour.alpha).toBe(getAmbientLighting(0).alpha);

    const overHour = getAmbientLighting(25);
    expect(overHour.alpha).toBe(getAmbientLighting(23).alpha);
  });

  it("returns valid color and alpha for all 24 hours", () => {
    for (let hour = 0; hour < 24; hour++) {
      const lighting = getAmbientLighting(hour);
      expect(lighting.color).toBeGreaterThanOrEqual(0);
      expect(lighting.color).toBeLessThanOrEqual(0xffffff);
      expect(lighting.alpha).toBeGreaterThanOrEqual(0);
      expect(lighting.alpha).toBeLessThanOrEqual(1);
    }
  });
});
