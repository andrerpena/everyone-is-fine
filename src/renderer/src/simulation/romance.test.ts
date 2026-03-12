import { describe, expect, it } from "vitest";
import {
  canFormRomance,
  getRelationshipLabel,
  ROMANCE_OPINION_THRESHOLD,
} from "./relationships";
import type { Character } from "./types";
import { createCharacter } from "./types";

function makeCharacter(overrides?: Partial<Character>): Character {
  return {
    ...createCharacter({ name: "Test", position: { x: 0, y: 0, z: 0 } }),
    ...overrides,
  };
}

describe("canFormRomance", () => {
  it("returns true when mutual opinion meets threshold and both are single", () => {
    const a = makeCharacter({
      id: "a",
      relationships: { b: ROMANCE_OPINION_THRESHOLD },
    });
    const b = makeCharacter({
      id: "b",
      relationships: { a: ROMANCE_OPINION_THRESHOLD },
    });
    expect(canFormRomance(a, b)).toBe(true);
  });

  it("returns false when one opinion is below threshold", () => {
    const a = makeCharacter({
      id: "a",
      relationships: { b: ROMANCE_OPINION_THRESHOLD },
    });
    const b = makeCharacter({
      id: "b",
      relationships: { a: ROMANCE_OPINION_THRESHOLD - 1 },
    });
    expect(canFormRomance(a, b)).toBe(false);
  });

  it("returns false when A already has a partner", () => {
    const a = makeCharacter({
      id: "a",
      partner: "someone_else",
      relationships: { b: ROMANCE_OPINION_THRESHOLD },
    });
    const b = makeCharacter({
      id: "b",
      relationships: { a: ROMANCE_OPINION_THRESHOLD },
    });
    expect(canFormRomance(a, b)).toBe(false);
  });

  it("returns false when B already has a partner", () => {
    const a = makeCharacter({
      id: "a",
      relationships: { b: ROMANCE_OPINION_THRESHOLD },
    });
    const b = makeCharacter({
      id: "b",
      partner: "someone_else",
      relationships: { a: ROMANCE_OPINION_THRESHOLD },
    });
    expect(canFormRomance(a, b)).toBe(false);
  });

  it("returns false when no relationship exists", () => {
    const a = makeCharacter({ id: "a" });
    const b = makeCharacter({ id: "b" });
    expect(canFormRomance(a, b)).toBe(false);
  });
});

describe("getRelationshipLabel with partner", () => {
  it("returns 'lover' when isPartner is true regardless of opinion", () => {
    expect(getRelationshipLabel(0, true)).toBe("lover");
    expect(getRelationshipLabel(-100, true)).toBe("lover");
    expect(getRelationshipLabel(100, true)).toBe("lover");
  });

  it("returns normal labels when isPartner is false", () => {
    expect(getRelationshipLabel(60)).toBe("close friend");
    expect(getRelationshipLabel(30)).toBe("friend");
    expect(getRelationshipLabel(-70)).toBe("rival");
  });
});

describe("ROMANCE_OPINION_THRESHOLD", () => {
  it("is a reasonable threshold", () => {
    expect(ROMANCE_OPINION_THRESHOLD).toBeGreaterThan(50);
    expect(ROMANCE_OPINION_THRESHOLD).toBeLessThanOrEqual(100);
  });
});
