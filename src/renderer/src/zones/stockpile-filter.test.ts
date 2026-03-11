import { describe, expect, it } from "vitest";
import {
  ALL_CATEGORIES,
  CATEGORY_ITEMS,
  createDefaultFilter,
  doesItemPassFilter,
  type StockpileFilter,
} from "./stockpile-filter";

describe("stockpile-filter", () => {
  // =========================================================================
  // CATEGORY_ITEMS mapping
  // =========================================================================

  it("maps every registered item to a category", () => {
    // resource, food, tool should all have items
    expect(CATEGORY_ITEMS.get("resource")).toBeDefined();
    expect(CATEGORY_ITEMS.get("food")).toBeDefined();
    expect(CATEGORY_ITEMS.get("tool")).toBeDefined();
  });

  it("includes expected items in categories", () => {
    expect(CATEGORY_ITEMS.get("resource")?.has("wood")).toBe(true);
    expect(CATEGORY_ITEMS.get("food")?.has("meat")).toBe(true);
    expect(CATEGORY_ITEMS.get("tool")?.has("axe")).toBe(true);
  });

  // =========================================================================
  // createDefaultFilter
  // =========================================================================

  it("creates a filter that accepts all categories", () => {
    const filter = createDefaultFilter();
    for (const cat of ALL_CATEGORIES) {
      expect(filter.allowedCategories.has(cat)).toBe(true);
    }
    expect(filter.disallowedTypes.size).toBe(0);
  });

  // =========================================================================
  // doesItemPassFilter — default filter
  // =========================================================================

  it("default filter accepts all item types", () => {
    const filter = createDefaultFilter();
    expect(doesItemPassFilter(filter, "wood")).toBe(true);
    expect(doesItemPassFilter(filter, "meat")).toBe(true);
    expect(doesItemPassFilter(filter, "axe")).toBe(true);
  });

  // =========================================================================
  // doesItemPassFilter — category filtering
  // =========================================================================

  it("rejects items whose category is not allowed", () => {
    const filter: StockpileFilter = {
      allowedCategories: new Set(["resource"]),
      disallowedTypes: new Set(),
    };
    expect(doesItemPassFilter(filter, "wood")).toBe(true);
    expect(doesItemPassFilter(filter, "stone")).toBe(true);
    expect(doesItemPassFilter(filter, "meat")).toBe(false); // food
    expect(doesItemPassFilter(filter, "axe")).toBe(false); // tool
  });

  it("food-only filter accepts food and rejects resources", () => {
    const filter: StockpileFilter = {
      allowedCategories: new Set(["food"]),
      disallowedTypes: new Set(),
    };
    expect(doesItemPassFilter(filter, "meal_simple")).toBe(true);
    expect(doesItemPassFilter(filter, "berries")).toBe(true);
    expect(doesItemPassFilter(filter, "wood")).toBe(false);
  });

  it("empty categories filter rejects everything", () => {
    const filter: StockpileFilter = {
      allowedCategories: new Set(),
      disallowedTypes: new Set(),
    };
    expect(doesItemPassFilter(filter, "wood")).toBe(false);
    expect(doesItemPassFilter(filter, "meat")).toBe(false);
    expect(doesItemPassFilter(filter, "axe")).toBe(false);
  });

  // =========================================================================
  // doesItemPassFilter — type exclusion
  // =========================================================================

  it("disallowed types override category allowance", () => {
    const filter: StockpileFilter = {
      allowedCategories: new Set(["resource"]),
      disallowedTypes: new Set(["gold", "silver"]),
    };
    expect(doesItemPassFilter(filter, "wood")).toBe(true);
    expect(doesItemPassFilter(filter, "iron")).toBe(true);
    expect(doesItemPassFilter(filter, "gold")).toBe(false);
    expect(doesItemPassFilter(filter, "silver")).toBe(false);
  });

  it("disallowed type in non-allowed category is still rejected", () => {
    const filter: StockpileFilter = {
      allowedCategories: new Set(["resource"]),
      disallowedTypes: new Set(["meat"]),
    };
    // meat is food (not allowed) AND explicitly disallowed — should be false
    expect(doesItemPassFilter(filter, "meat")).toBe(false);
  });

  // =========================================================================
  // Multiple categories
  // =========================================================================

  it("multiple allowed categories work correctly", () => {
    const filter: StockpileFilter = {
      allowedCategories: new Set(["resource", "tool"]),
      disallowedTypes: new Set(),
    };
    expect(doesItemPassFilter(filter, "wood")).toBe(true);
    expect(doesItemPassFilter(filter, "axe")).toBe(true);
    expect(doesItemPassFilter(filter, "meat")).toBe(false);
  });
});
