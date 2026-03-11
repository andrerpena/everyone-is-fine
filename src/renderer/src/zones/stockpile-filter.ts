// =============================================================================
// STOCKPILE FILTER
// =============================================================================
// Pure utilities for filtering which items a stockpile zone accepts.

import { ITEM_REGISTRY } from "../world/registries/item-registry";
import type { ItemCategory, ItemType } from "../world/types";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Filter configuration for a stockpile zone.
 * - `allowedCategories`: which item categories are accepted (empty = none)
 * - `disallowedTypes`: specific item types to exclude even if their category is allowed
 */
export interface StockpileFilter {
  /** Item categories this stockpile accepts */
  allowedCategories: Set<ItemCategory>;
  /** Specific item types to exclude (overrides category allowance) */
  disallowedTypes: Set<ItemType>;
}

// =============================================================================
// CATEGORY → ITEMS MAPPING
// =============================================================================

/** Map of each category to the item types it contains (derived from ITEM_REGISTRY) */
export const CATEGORY_ITEMS: ReadonlyMap<
  ItemCategory,
  ReadonlySet<ItemType>
> = (() => {
  const map = new Map<ItemCategory, Set<ItemType>>();
  for (const [itemType, props] of Object.entries(ITEM_REGISTRY)) {
    let set = map.get(props.category);
    if (!set) {
      set = new Set();
      map.set(props.category, set);
    }
    set.add(itemType as ItemType);
  }
  return map;
})();

/** All categories that currently have registered items */
export const ALL_CATEGORIES: readonly ItemCategory[] = Array.from(
  CATEGORY_ITEMS.keys(),
);

// =============================================================================
// FACTORY
// =============================================================================

/** Create a default filter that accepts all item categories */
export function createDefaultFilter(): StockpileFilter {
  return {
    allowedCategories: new Set(ALL_CATEGORIES),
    disallowedTypes: new Set(),
  };
}

// =============================================================================
// MATCHING
// =============================================================================

/** Check whether a given item type passes through the filter */
export function doesItemPassFilter(
  filter: StockpileFilter,
  itemType: ItemType,
): boolean {
  // Explicitly excluded types are always rejected
  if (filter.disallowedTypes.has(itemType)) {
    return false;
  }

  // Check category allowance
  const props = ITEM_REGISTRY[itemType];
  return filter.allowedCategories.has(props.category);
}
