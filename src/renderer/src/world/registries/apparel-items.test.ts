import { describe, expect, it } from "vitest";
import { ITEM_REGISTRY } from "./item-registry";

describe("apparel item types", () => {
  const apparelTypes = [
    "shirt",
    "pants",
    "jacket",
    "hat",
    "boots",
    "armor_leather",
    "armor_metal",
  ] as const;

  it("all apparel types exist in the registry", () => {
    for (const type of apparelTypes) {
      expect(ITEM_REGISTRY[type]).toBeDefined();
    }
  });

  it("all apparel types have category apparel", () => {
    for (const type of apparelTypes) {
      expect(ITEM_REGISTRY[type].category).toBe("apparel");
    }
  });

  it("all apparel items have stack size 1", () => {
    for (const type of apparelTypes) {
      expect(ITEM_REGISTRY[type].stackSize).toBe(1);
    }
  });

  it("all apparel items have zero nutrition", () => {
    for (const type of apparelTypes) {
      expect(ITEM_REGISTRY[type].nutrition).toBe(0);
    }
  });

  it("all apparel items are non-perishable", () => {
    for (const type of apparelTypes) {
      expect(ITEM_REGISTRY[type].spoilageRate).toBe(0);
    }
  });

  it("all apparel items have positive base value", () => {
    for (const type of apparelTypes) {
      expect(ITEM_REGISTRY[type].baseValue).toBeGreaterThan(0);
    }
  });

  it("armor is more valuable than clothing", () => {
    expect(ITEM_REGISTRY.armor_leather.baseValue).toBeGreaterThan(
      ITEM_REGISTRY.shirt.baseValue,
    );
    expect(ITEM_REGISTRY.armor_metal.baseValue).toBeGreaterThan(
      ITEM_REGISTRY.armor_leather.baseValue,
    );
  });

  it("armor is heavier than clothing", () => {
    expect(ITEM_REGISTRY.armor_leather.weight).toBeGreaterThan(
      ITEM_REGISTRY.jacket.weight,
    );
    expect(ITEM_REGISTRY.armor_metal.weight).toBeGreaterThan(
      ITEM_REGISTRY.armor_leather.weight,
    );
  });
});
