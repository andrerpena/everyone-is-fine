import { describe, expect, it } from "vitest";
import { ITEM_REGISTRY } from "./item-registry";

describe("medicine item types", () => {
  const medicineTypes = [
    "medicine_herbal",
    "medicine_industrial",
    "medicine_glitterworld",
  ] as const;

  it("all medicine types exist in the registry", () => {
    for (const type of medicineTypes) {
      expect(ITEM_REGISTRY[type]).toBeDefined();
    }
  });

  it("all medicine types have category medicine", () => {
    for (const type of medicineTypes) {
      expect(ITEM_REGISTRY[type].category).toBe("medicine");
    }
  });

  it("all medicine types have zero nutrition", () => {
    for (const type of medicineTypes) {
      expect(ITEM_REGISTRY[type].nutrition).toBe(0);
    }
  });

  it("herbal medicine is cheapest, glitterworld is most expensive", () => {
    expect(ITEM_REGISTRY.medicine_herbal.baseValue).toBeLessThan(
      ITEM_REGISTRY.medicine_industrial.baseValue,
    );
    expect(ITEM_REGISTRY.medicine_industrial.baseValue).toBeLessThan(
      ITEM_REGISTRY.medicine_glitterworld.baseValue,
    );
  });

  it("herbal medicine spoils, industrial and glitterworld do not", () => {
    expect(ITEM_REGISTRY.medicine_herbal.spoilageRate).toBeGreaterThan(0);
    expect(ITEM_REGISTRY.medicine_industrial.spoilageRate).toBe(0);
    expect(ITEM_REGISTRY.medicine_glitterworld.spoilageRate).toBe(0);
  });

  it("glitterworld medicine has smaller stack size", () => {
    expect(ITEM_REGISTRY.medicine_glitterworld.stackSize).toBeLessThan(
      ITEM_REGISTRY.medicine_herbal.stackSize,
    );
  });
});
