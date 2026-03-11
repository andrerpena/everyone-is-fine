import { describe, expect, it } from "vitest";
import { ITEM_REGISTRY } from "./item-registry";

describe("meal item types", () => {
  const mealTypes = [
    "meal_simple",
    "meal_fine",
    "meal_lavish",
    "nutrient_paste",
  ] as const;

  it("all meal types exist in the registry", () => {
    for (const type of mealTypes) {
      expect(ITEM_REGISTRY[type]).toBeDefined();
    }
  });

  it("all meal types have category food", () => {
    for (const type of mealTypes) {
      expect(ITEM_REGISTRY[type].category).toBe("food");
    }
  });

  it("all meals have positive nutrition", () => {
    for (const type of mealTypes) {
      expect(ITEM_REGISTRY[type].nutrition).toBeGreaterThan(0);
    }
  });

  it("lavish meal is more valuable than fine meal", () => {
    expect(ITEM_REGISTRY.meal_lavish.baseValue).toBeGreaterThan(
      ITEM_REGISTRY.meal_fine.baseValue,
    );
  });

  it("fine meal is more valuable than simple meal", () => {
    expect(ITEM_REGISTRY.meal_fine.baseValue).toBeGreaterThan(
      ITEM_REGISTRY.meal_simple.baseValue,
    );
  });

  it("nutrient paste is the least valuable meal", () => {
    expect(ITEM_REGISTRY.nutrient_paste.baseValue).toBeLessThan(
      ITEM_REGISTRY.meal_simple.baseValue,
    );
  });

  it("nutrient paste does not spoil", () => {
    expect(ITEM_REGISTRY.nutrient_paste.spoilageRate).toBe(0);
  });

  it("cooked meals spoil at the same rate", () => {
    expect(ITEM_REGISTRY.meal_simple.spoilageRate).toBe(
      ITEM_REGISTRY.meal_fine.spoilageRate,
    );
    expect(ITEM_REGISTRY.meal_fine.spoilageRate).toBe(
      ITEM_REGISTRY.meal_lavish.spoilageRate,
    );
    expect(ITEM_REGISTRY.meal_simple.spoilageRate).toBeGreaterThan(0);
  });
});
