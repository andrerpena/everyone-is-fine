import { describe, expect, it } from "vitest";
import {
  getRecipesForWorkstation,
  meetsSkillRequirement,
  RECIPE_REGISTRY,
} from "../../world/registries/recipe-registry";
import type { ItemType } from "../../world/types";
import {
  type FoundIngredient,
  isRawFood,
  selectRecipe,
} from "./cooking-system";

// Helper to create a fake FoundIngredient
function makeFoodItem(
  type: ItemType,
  id = `item-${type}-${Math.random()}`,
): FoundIngredient {
  return {
    position: { x: 5, y: 5, z: 0 },
    item: { id, type, quantity: 1, quality: 0.5 },
  };
}

function makeNearbyFood(
  items: Array<{ type: ItemType; count: number }>,
): Map<ItemType, FoundIngredient[]> {
  const map = new Map<ItemType, FoundIngredient[]>();
  for (const { type, count } of items) {
    const list: FoundIngredient[] = [];
    for (let i = 0; i < count; i++) {
      list.push(makeFoodItem(type, `${type}-${i}`));
    }
    map.set(type, list);
  }
  return map;
}

describe("isRawFood", () => {
  it("identifies meat as raw food", () => {
    expect(isRawFood("meat")).toBe(true);
  });

  it("identifies berries as raw food", () => {
    expect(isRawFood("berries")).toBe(true);
  });

  it("identifies vegetable as raw food", () => {
    expect(isRawFood("vegetable")).toBe(true);
  });

  it("rejects meals as raw food", () => {
    expect(isRawFood("meal_simple")).toBe(false);
    expect(isRawFood("meal_fine")).toBe(false);
    expect(isRawFood("meal_lavish")).toBe(false);
  });

  it("rejects non-food items", () => {
    expect(isRawFood("wood")).toBe(false);
    expect(isRawFood("stone")).toBe(false);
  });
});

describe("recipe registry", () => {
  it("has campfire recipes in tier order (lavish, fine, simple)", () => {
    const recipes = getRecipesForWorkstation("campfire");
    expect(recipes.length).toBe(3);
    expect(recipes[0].id).toBe("cook_lavish");
    expect(recipes[1].id).toBe("cook_fine");
    expect(recipes[2].id).toBe("cook_simple");
  });

  it("lavish requires cooking skill 8", () => {
    const lavish = RECIPE_REGISTRY.find((r) => r.id === "cook_lavish")!;
    expect(meetsSkillRequirement(lavish, 7)).toBe(false);
    expect(meetsSkillRequirement(lavish, 8)).toBe(true);
  });

  it("fine requires cooking skill 4", () => {
    const fine = RECIPE_REGISTRY.find((r) => r.id === "cook_fine")!;
    expect(meetsSkillRequirement(fine, 3)).toBe(false);
    expect(meetsSkillRequirement(fine, 4)).toBe(true);
  });

  it("simple has no skill requirement", () => {
    const simple = RECIPE_REGISTRY.find((r) => r.id === "cook_simple")!;
    expect(meetsSkillRequirement(simple, 0)).toBe(true);
  });
});

describe("selectRecipe", () => {
  const recipes = getRecipesForWorkstation("campfire");

  it("selects simple meal for low-skill cook with any food", () => {
    const food = makeNearbyFood([{ type: "berries", count: 1 }]);
    const result = selectRecipe(recipes, 0, food);
    expect(result).not.toBeNull();
    expect(result!.recipe.id).toBe("cook_simple");
    expect(result!.itemsToConsume).toHaveLength(1);
  });

  it("selects fine meal when cook has skill 4+ and meat+vegetable", () => {
    const food = makeNearbyFood([
      { type: "meat", count: 1 },
      { type: "vegetable", count: 1 },
    ]);
    const result = selectRecipe(recipes, 4, food);
    expect(result).not.toBeNull();
    expect(result!.recipe.id).toBe("cook_fine");
    expect(result!.itemsToConsume).toHaveLength(2);
  });

  it("selects lavish meal when cook has skill 8+ and enough ingredients", () => {
    const food = makeNearbyFood([
      { type: "meat", count: 1 },
      { type: "vegetable", count: 2 },
    ]);
    const result = selectRecipe(recipes, 8, food);
    expect(result).not.toBeNull();
    expect(result!.recipe.id).toBe("cook_lavish");
    expect(result!.itemsToConsume).toHaveLength(3);
  });

  it("falls back to fine when lavish ingredients insufficient", () => {
    const food = makeNearbyFood([
      { type: "meat", count: 1 },
      { type: "vegetable", count: 1 },
    ]);
    const result = selectRecipe(recipes, 10, food);
    expect(result).not.toBeNull();
    expect(result!.recipe.id).toBe("cook_fine");
  });

  it("falls back to simple when no meat available (skill 10)", () => {
    const food = makeNearbyFood([{ type: "berries", count: 5 }]);
    const result = selectRecipe(recipes, 10, food);
    expect(result).not.toBeNull();
    expect(result!.recipe.id).toBe("cook_simple");
  });

  it("returns null when no food available", () => {
    const food = new Map<ItemType, FoundIngredient[]>();
    const result = selectRecipe(recipes, 10, food);
    expect(result).toBeNull();
  });

  it("skill 3 cook only gets simple even with meat+vegetable", () => {
    const food = makeNearbyFood([
      { type: "meat", count: 1 },
      { type: "vegetable", count: 2 },
    ]);
    const result = selectRecipe(recipes, 3, food);
    expect(result).not.toBeNull();
    expect(result!.recipe.id).toBe("cook_simple");
  });
});
