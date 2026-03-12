import { describe, expect, it } from "vitest";
import {
  FILTH_CHANCE,
  FILTH_CHECK_INTERVAL,
  FILTH_MAX,
  FilthSystem,
} from "./filth-system";

describe("filth system constants", () => {
  it("has a reasonable check interval", () => {
    expect(FILTH_CHECK_INTERVAL).toBeGreaterThan(0);
    expect(FILTH_CHECK_INTERVAL).toBeLessThanOrEqual(120);
  });

  it("has a small filth chance", () => {
    expect(FILTH_CHANCE).toBeGreaterThan(0);
    expect(FILTH_CHANCE).toBeLessThanOrEqual(0.1);
  });

  it("has a positive max filth", () => {
    expect(FILTH_MAX).toBeGreaterThan(0);
  });
});

describe("FilthSystem", () => {
  it("can be instantiated", () => {
    const mockStore = { values: () => [][Symbol.iterator]() } as never;
    const system = new FilthSystem(mockStore);
    expect(system).toBeDefined();
  });
});
