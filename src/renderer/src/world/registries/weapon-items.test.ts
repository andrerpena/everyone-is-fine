import { describe, expect, it } from "vitest";
import { ITEM_REGISTRY } from "./item-registry";

describe("weapon item types", () => {
  const meleeTypes = ["knife", "sword", "spear", "club"] as const;
  const rangedTypes = ["bow", "pistol"] as const;
  const allWeapons = [...meleeTypes, ...rangedTypes] as const;

  it("all weapon types exist in the registry", () => {
    for (const type of allWeapons) {
      expect(ITEM_REGISTRY[type]).toBeDefined();
    }
  });

  it("all weapon types have category weapon", () => {
    for (const type of allWeapons) {
      expect(ITEM_REGISTRY[type].category).toBe("weapon");
    }
  });

  it("all weapons have stack size 1", () => {
    for (const type of allWeapons) {
      expect(ITEM_REGISTRY[type].stackSize).toBe(1);
    }
  });

  it("all weapons have zero nutrition", () => {
    for (const type of allWeapons) {
      expect(ITEM_REGISTRY[type].nutrition).toBe(0);
    }
  });

  it("all weapons are non-perishable", () => {
    for (const type of allWeapons) {
      expect(ITEM_REGISTRY[type].spoilageRate).toBe(0);
    }
  });

  it("all weapons have positive base value", () => {
    for (const type of allWeapons) {
      expect(ITEM_REGISTRY[type].baseValue).toBeGreaterThan(0);
    }
  });

  it("sword is more valuable than knife", () => {
    expect(ITEM_REGISTRY.sword.baseValue).toBeGreaterThan(
      ITEM_REGISTRY.knife.baseValue,
    );
  });

  it("pistol is the most valuable weapon", () => {
    for (const type of allWeapons) {
      if (type === "pistol") continue;
      expect(ITEM_REGISTRY.pistol.baseValue).toBeGreaterThan(
        ITEM_REGISTRY[type].baseValue,
      );
    }
  });
});
