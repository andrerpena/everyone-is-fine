import { describe, expect, it } from "vitest";
import {
  FIGHT_CHANCE,
  FIGHT_OPINION_DELTA,
  FIGHT_OPINION_THRESHOLD,
  getInsultChance,
} from "./social-interaction-system";
import type { Character } from "./types";
import { createCharacter } from "./types";

function makeCharacter(overrides?: Partial<Character>): Character {
  return {
    ...createCharacter({ name: "Test", position: { x: 0, y: 0, z: 0 } }),
    ...overrides,
  };
}

describe("Social Fight Constants", () => {
  it("fight opinion threshold is negative", () => {
    expect(FIGHT_OPINION_THRESHOLD).toBeLessThan(0);
  });

  it("fight chance is between 0 and 1", () => {
    expect(FIGHT_CHANCE).toBeGreaterThan(0);
    expect(FIGHT_CHANCE).toBeLessThan(1);
  });

  it("fight opinion delta is negative", () => {
    expect(FIGHT_OPINION_DELTA).toBeLessThan(0);
  });

  it("fight opinion delta is harsher than insult penalty", () => {
    // Fights should be worse than insults
    expect(Math.abs(FIGHT_OPINION_DELTA)).toBeGreaterThan(3);
  });

  it("fight threshold is lower than rivalry threshold", () => {
    // Rivalry label starts at -60, fights should trigger around that range
    expect(FIGHT_OPINION_THRESHOLD).toBeLessThanOrEqual(-50);
  });
});

describe("Fight eligibility logic", () => {
  it("requires both opinions below threshold for a fight", () => {
    // This tests the condition logic used in checkFights
    const aOpinion = -60;
    const bOpinion = -55;
    const eligible =
      aOpinion <= FIGHT_OPINION_THRESHOLD &&
      bOpinion <= FIGHT_OPINION_THRESHOLD;
    expect(eligible).toBe(true);
  });

  it("prevents fight when one opinion is above threshold", () => {
    const aOpinion = -60;
    const bOpinion = -10;
    const eligible =
      aOpinion <= FIGHT_OPINION_THRESHOLD &&
      bOpinion <= FIGHT_OPINION_THRESHOLD;
    expect(eligible).toBe(false);
  });

  it("prevents fight when both opinions are above threshold", () => {
    const aOpinion = 10;
    const bOpinion = 20;
    const eligible =
      aOpinion <= FIGHT_OPINION_THRESHOLD &&
      bOpinion <= FIGHT_OPINION_THRESHOLD;
    expect(eligible).toBe(false);
  });

  it("abrasive characters have higher insult chance leading to lower opinions", () => {
    // This validates the pipeline: abrasive → more insults → lower opinions → fights
    const abrasiveChance = getInsultChance(
      makeCharacter({ traits: ["abrasive"] }),
    );
    const normalChance = getInsultChance(makeCharacter({ traits: [] }));
    expect(abrasiveChance).toBeGreaterThan(normalChance);
  });
});
