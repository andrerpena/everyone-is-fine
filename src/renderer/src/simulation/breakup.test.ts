import { describe, expect, it } from "vitest";
import {
  BREAKUP_OPINION_THRESHOLD,
  ROMANCE_OPINION_THRESHOLD,
  shouldBreakUp,
} from "./relationships";
import type { Character } from "./types";
import { createCharacter } from "./types";

function makeCharacter(overrides?: Partial<Character>): Character {
  return {
    ...createCharacter({ name: "Test", position: { x: 0, y: 0, z: 0 } }),
    ...overrides,
  };
}

describe("shouldBreakUp", () => {
  it("returns true when A's opinion of B is below threshold", () => {
    const a = makeCharacter({
      id: "a",
      partner: "b",
      relationships: { b: BREAKUP_OPINION_THRESHOLD - 1 },
    });
    const b = makeCharacter({
      id: "b",
      partner: "a",
      relationships: { a: ROMANCE_OPINION_THRESHOLD },
    });
    expect(shouldBreakUp(a, b)).toBe(true);
  });

  it("returns true when B's opinion of A is below threshold", () => {
    const a = makeCharacter({
      id: "a",
      partner: "b",
      relationships: { b: ROMANCE_OPINION_THRESHOLD },
    });
    const b = makeCharacter({
      id: "b",
      partner: "a",
      relationships: { a: BREAKUP_OPINION_THRESHOLD - 1 },
    });
    expect(shouldBreakUp(a, b)).toBe(true);
  });

  it("returns false when both opinions are at or above threshold", () => {
    const a = makeCharacter({
      id: "a",
      partner: "b",
      relationships: { b: BREAKUP_OPINION_THRESHOLD },
    });
    const b = makeCharacter({
      id: "b",
      partner: "a",
      relationships: { a: BREAKUP_OPINION_THRESHOLD },
    });
    expect(shouldBreakUp(a, b)).toBe(false);
  });

  it("returns true when both opinions are below threshold", () => {
    const a = makeCharacter({
      id: "a",
      partner: "b",
      relationships: { b: -50 },
    });
    const b = makeCharacter({
      id: "b",
      partner: "a",
      relationships: { a: -30 },
    });
    expect(shouldBreakUp(a, b)).toBe(true);
  });
});

describe("BREAKUP_OPINION_THRESHOLD", () => {
  it("is well below ROMANCE_OPINION_THRESHOLD to prevent oscillation", () => {
    expect(BREAKUP_OPINION_THRESHOLD).toBeLessThan(
      ROMANCE_OPINION_THRESHOLD - 20,
    );
  });

  it("is a positive number", () => {
    expect(BREAKUP_OPINION_THRESHOLD).toBeGreaterThan(0);
  });
});
