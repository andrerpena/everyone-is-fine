import { describe, expect, it } from "vitest";
import { getMoodIndicatorColor } from "./CharacterRenderer";

describe("getMoodIndicatorColor", () => {
  it("returns null for happy mood (>= 0.5)", () => {
    expect(getMoodIndicatorColor(0.5)).toBeNull();
    expect(getMoodIndicatorColor(0.75)).toBeNull();
    expect(getMoodIndicatorColor(1)).toBeNull();
  });

  it("returns yellow for slightly low mood (0.35-0.49)", () => {
    expect(getMoodIndicatorColor(0.49)).toBe(0xffc107);
    expect(getMoodIndicatorColor(0.35)).toBe(0xffc107);
  });

  it("returns orange for low mood (0.15-0.34)", () => {
    expect(getMoodIndicatorColor(0.34)).toBe(0xff9800);
    expect(getMoodIndicatorColor(0.15)).toBe(0xff9800);
  });

  it("returns red for critical mood (< 0.15)", () => {
    expect(getMoodIndicatorColor(0.14)).toBe(0xf44336);
    expect(getMoodIndicatorColor(0)).toBe(0xf44336);
  });
});
