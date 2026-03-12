import { describe, expect, it } from "vitest";
import {
  getInsultChance,
  INSULT_ABRASIVE_BONUS,
  INSULT_BASE_CHANCE,
  INSULT_KIND_REDUCTION,
  INSULT_OPINION_DELTA,
} from "./social-interaction-system";
import type { Character } from "./types";
import { createCharacter } from "./types";

function makeCharacter(overrides?: Partial<Character>): Character {
  return {
    ...createCharacter({ name: "Test", position: { x: 0, y: 0, z: 0 } }),
    ...overrides,
  };
}

describe("getInsultChance", () => {
  it("returns base chance for character with no relevant traits", () => {
    const c = makeCharacter({ traits: [] });
    expect(getInsultChance(c)).toBeCloseTo(INSULT_BASE_CHANCE);
  });

  it("increases chance for abrasive trait", () => {
    const c = makeCharacter({ traits: ["abrasive"] });
    expect(getInsultChance(c)).toBeCloseTo(
      INSULT_BASE_CHANCE + INSULT_ABRASIVE_BONUS,
    );
  });

  it("decreases chance for kind trait", () => {
    const c = makeCharacter({ traits: ["kind"] });
    expect(getInsultChance(c)).toBeCloseTo(
      INSULT_BASE_CHANCE - INSULT_KIND_REDUCTION,
    );
  });

  it("never returns negative chance", () => {
    // Even with kind trait, chance should be >= 0
    const c = makeCharacter({ traits: ["kind"] });
    expect(getInsultChance(c)).toBeGreaterThanOrEqual(0);
  });

  it("handles unrelated traits", () => {
    const c = makeCharacter({ traits: ["optimist", "brave"] });
    expect(getInsultChance(c)).toBeCloseTo(INSULT_BASE_CHANCE);
  });
});

describe("insult constants", () => {
  it("has reasonable base chance", () => {
    expect(INSULT_BASE_CHANCE).toBeGreaterThan(0);
    expect(INSULT_BASE_CHANCE).toBeLessThanOrEqual(0.2);
  });

  it("has negative opinion delta", () => {
    expect(INSULT_OPINION_DELTA).toBeLessThan(0);
  });

  it("opinion penalty is stronger than normal chat gain", () => {
    expect(Math.abs(INSULT_OPINION_DELTA)).toBeGreaterThan(1);
  });
});
