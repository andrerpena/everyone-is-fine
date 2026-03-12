import { describe, expect, it } from "vitest";
import { TICKS_PER_HOUR } from "../world/types";
import {
  FOOD_POISONING_DURATION_TICKS,
  getFoodPoisoningChance,
  rollFoodPoisoning,
} from "./food-poisoning";

describe("food poisoning", () => {
  describe("getFoodPoisoningChance", () => {
    it("returns 40% chance at quality 0", () => {
      expect(getFoodPoisoningChance(0)).toBeCloseTo(0.4);
    });

    it("returns 0% chance at quality 1", () => {
      expect(getFoodPoisoningChance(1)).toBeCloseTo(0);
    });

    it("returns 20% chance at quality 0.5", () => {
      expect(getFoodPoisoningChance(0.5)).toBeCloseTo(0.2);
    });

    it("clamps quality below 0", () => {
      expect(getFoodPoisoningChance(-0.5)).toBeCloseTo(0.4);
    });

    it("clamps quality above 1", () => {
      expect(getFoodPoisoningChance(1.5)).toBeCloseTo(0);
    });
  });

  describe("rollFoodPoisoning", () => {
    it("returns true when random is below chance", () => {
      // Quality 0 → 40% chance, random 0.1 → true
      expect(rollFoodPoisoning(0, 0.1)).toBe(true);
    });

    it("returns false when random is above chance", () => {
      // Quality 0 → 40% chance, random 0.5 → false
      expect(rollFoodPoisoning(0, 0.5)).toBe(false);
    });

    it("never triggers for perfect quality", () => {
      expect(rollFoodPoisoning(1, 0)).toBe(false);
    });

    it("triggers at boundary", () => {
      // Quality 0.5 → 20% chance, random exactly 0.2 → false (not strictly less than)
      expect(rollFoodPoisoning(0.5, 0.2)).toBe(false);
      // random 0.19 → true
      expect(rollFoodPoisoning(0.5, 0.19)).toBe(true);
    });
  });

  describe("constants", () => {
    it("duration is 6 in-game hours", () => {
      expect(FOOD_POISONING_DURATION_TICKS).toBe(TICKS_PER_HOUR * 6);
    });
  });
});
