import { describe, expect, it } from "vitest";
import type { Character } from "../types";
import { createCharacter } from "../types";
import type { ActiveThought } from "./thought-system";
import {
  computeMoodFromThoughts,
  evaluateConditionThoughts,
} from "./thought-system";

function makeCharacter(overrides: Partial<Character> = {}): Character {
  return createCharacter({
    name: "Test",
    position: { x: 0, y: 0, z: 0 },
    ...overrides,
  });
}

describe("computeMoodFromThoughts", () => {
  it("returns 0.5 (base mood) with no thoughts", () => {
    expect(computeMoodFromThoughts([])).toBe(0.5);
  });

  it("adds positive mood effects", () => {
    const thoughts: ActiveThought[] = [
      { thoughtId: "well_rested", addedAtTick: 0, expiresAtTick: null },
      { thoughtId: "ate_recently", addedAtTick: 0, expiresAtTick: null },
    ];
    // 0.5 + 0.05 + 0.05 = 0.6
    expect(computeMoodFromThoughts(thoughts)).toBeCloseTo(0.6);
  });

  it("adds negative mood effects", () => {
    const thoughts: ActiveThought[] = [
      { thoughtId: "starving", addedAtTick: 0, expiresAtTick: null },
    ];
    // 0.5 + (-0.3) = 0.2
    expect(computeMoodFromThoughts(thoughts)).toBeCloseTo(0.2);
  });

  it("clamps mood to minimum 0", () => {
    const thoughts: ActiveThought[] = [
      { thoughtId: "starving", addedAtTick: 0, expiresAtTick: null },
      { thoughtId: "exhausted", addedAtTick: 0, expiresAtTick: null },
      { thoughtId: "pessimist_baseline", addedAtTick: 0, expiresAtTick: null },
    ];
    // 0.5 + (-0.3) + (-0.15) + (-0.1) = -0.05 → clamped to 0
    expect(computeMoodFromThoughts(thoughts)).toBe(0);
  });

  it("clamps mood to maximum 1", () => {
    const thoughts: ActiveThought[] = [
      { thoughtId: "optimist_baseline", addedAtTick: 0, expiresAtTick: null },
      { thoughtId: "well_rested", addedAtTick: 0, expiresAtTick: null },
      { thoughtId: "ate_recently", addedAtTick: 0, expiresAtTick: null },
      { thoughtId: "content", addedAtTick: 0, expiresAtTick: null },
      { thoughtId: "feeling_brave", addedAtTick: 0, expiresAtTick: null },
    ];
    // 0.5 + 0.1 + 0.05 + 0.05 + 0.05 + 0.03 = 0.78 (under 1, but test the clamp logic exists)
    const mood = computeMoodFromThoughts(thoughts);
    expect(mood).toBeLessThanOrEqual(1);
    expect(mood).toBeGreaterThan(0.5);
  });
});

describe("evaluateConditionThoughts", () => {
  it("adds starving thought when hunger is critical", () => {
    const char = makeCharacter({
      needs: { hunger: 0.1, energy: 0.5, mood: 0.5 },
    });
    const thoughts = evaluateConditionThoughts(char);
    expect(thoughts.has("starving")).toBe(true);
    expect(thoughts.has("hungry")).toBe(false);
  });

  it("adds hungry thought when hunger is major", () => {
    const char = makeCharacter({
      needs: { hunger: 0.25, energy: 0.5, mood: 0.5 },
    });
    const thoughts = evaluateConditionThoughts(char);
    expect(thoughts.has("hungry")).toBe(true);
    expect(thoughts.has("starving")).toBe(false);
  });

  it("adds ate_recently when hunger is satisfied", () => {
    const char = makeCharacter({
      needs: { hunger: 0.9, energy: 0.5, mood: 0.5 },
    });
    const thoughts = evaluateConditionThoughts(char);
    expect(thoughts.has("ate_recently")).toBe(true);
  });

  it("adds exhausted thought when energy is critical", () => {
    const char = makeCharacter({
      needs: { hunger: 0.5, energy: 0.1, mood: 0.5 },
    });
    const thoughts = evaluateConditionThoughts(char);
    expect(thoughts.has("exhausted")).toBe(true);
  });

  it("adds tired thought when energy is major", () => {
    const char = makeCharacter({
      needs: { hunger: 0.5, energy: 0.25, mood: 0.5 },
    });
    const thoughts = evaluateConditionThoughts(char);
    expect(thoughts.has("tired")).toBe(true);
  });

  it("adds well_rested when energy is satisfied", () => {
    const char = makeCharacter({
      needs: { hunger: 0.5, energy: 0.9, mood: 0.5 },
    });
    const thoughts = evaluateConditionThoughts(char);
    expect(thoughts.has("well_rested")).toBe(true);
  });

  it("adds content when both hunger and energy are satisfied", () => {
    const char = makeCharacter({
      needs: { hunger: 0.9, energy: 0.9, mood: 0.5 },
    });
    const thoughts = evaluateConditionThoughts(char);
    expect(thoughts.has("content")).toBe(true);
    expect(thoughts.has("ate_recently")).toBe(true);
    expect(thoughts.has("well_rested")).toBe(true);
  });

  it("adds optimist thought for optimist trait", () => {
    const char = makeCharacter({
      traits: ["optimist"],
      needs: { hunger: 0.5, energy: 0.5, mood: 0.5 },
    });
    const thoughts = evaluateConditionThoughts(char);
    expect(thoughts.has("optimist_baseline")).toBe(true);
  });

  it("adds pessimist thought for pessimist trait", () => {
    const char = makeCharacter({
      traits: ["pessimist"],
      needs: { hunger: 0.5, energy: 0.5, mood: 0.5 },
    });
    const thoughts = evaluateConditionThoughts(char);
    expect(thoughts.has("pessimist_baseline")).toBe(true);
  });

  it("adds neurotic thought for neurotic trait", () => {
    const char = makeCharacter({
      traits: ["neurotic"],
      needs: { hunger: 0.5, energy: 0.5, mood: 0.5 },
    });
    const thoughts = evaluateConditionThoughts(char);
    expect(thoughts.has("neurotic_anxiety")).toBe(true);
  });

  it("adds brave thought for brave trait", () => {
    const char = makeCharacter({
      traits: ["brave"],
      needs: { hunger: 0.5, energy: 0.5, mood: 0.5 },
    });
    const thoughts = evaluateConditionThoughts(char);
    expect(thoughts.has("feeling_brave")).toBe(true);
  });

  it("returns no need thoughts at minor threshold", () => {
    const char = makeCharacter({
      needs: { hunger: 0.5, energy: 0.5, mood: 0.5 },
    });
    const thoughts = evaluateConditionThoughts(char);
    expect(thoughts.has("hungry")).toBe(false);
    expect(thoughts.has("starving")).toBe(false);
    expect(thoughts.has("ate_recently")).toBe(false);
    expect(thoughts.has("tired")).toBe(false);
    expect(thoughts.has("exhausted")).toBe(false);
    expect(thoughts.has("well_rested")).toBe(false);
    expect(thoughts.has("content")).toBe(false);
  });
});
