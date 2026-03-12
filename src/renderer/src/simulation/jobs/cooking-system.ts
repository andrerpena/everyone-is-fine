// =============================================================================
// COOKING SYSTEM
// =============================================================================
// Periodically scans for campfires with nearby raw food and assigns cook
// jobs to idle colonists. Uses the recipe registry to determine what meal
// type to produce based on available ingredients and cook skill.

import { ITEM_REGISTRY } from "../../world/registries/item-registry";
import {
  type CraftingRecipe,
  getRecipesForWorkstation,
  meetsSkillRequirement,
} from "../../world/registries/recipe-registry";
import type { ItemData, ItemType, Position3D, World } from "../../world/types";
import {
  getWorldTileAt,
  removeItemFromTile,
} from "../../world/utils/tile-utils";
import type { EntityStore } from "../entity-store";
import type { EntityId } from "../types";
import { getEligibleCharacters } from "../work-priorities";
import { createCookJob, createDispenserJob } from "./job-factory";
import type { JobProcessor } from "./job-processor";

// =============================================================================
// CONSTANTS
// =============================================================================

/** How often (in ticks) the cooking system scans for work */
const CHECK_INTERVAL = 120;

/** Maximum cook jobs to assign per scan */
const MAX_JOBS_PER_SCAN = 3;

/** Search radius around campfire for raw food (in tiles) */
const FOOD_SEARCH_RADIUS = 10;

// =============================================================================
// HELPERS
// =============================================================================

/** Item categories/types considered raw food for cooking */
export function isRawFood(itemType: string): boolean {
  const props = ITEM_REGISTRY[itemType as keyof typeof ITEM_REGISTRY];
  if (!props) return false;
  return (
    props.nutrition > 0 &&
    props.category === "food" &&
    !itemType.startsWith("meal_")
  );
}

/** Result of finding ingredients: items to consume grouped by tile position */
export interface FoundIngredient {
  position: Position3D;
  item: ItemData;
}

/**
 * Select the best recipe a cook can make given available food near a workstation.
 * Recipes are tried in registry order (highest-tier first).
 * Returns the matched recipe and the ingredient items to consume, or null.
 */
export function selectRecipe(
  recipes: readonly CraftingRecipe[],
  cookSkillLevel: number,
  nearbyFood: Map<ItemType, FoundIngredient[]>,
): { recipe: CraftingRecipe; itemsToConsume: FoundIngredient[] } | null {
  for (const recipe of recipes) {
    if (!meetsSkillRequirement(recipe, cookSkillLevel)) continue;

    if (recipe.ingredients.length === 0) {
      // Simple recipe — any single raw food item
      for (const items of nearbyFood.values()) {
        if (items.length > 0) {
          return { recipe, itemsToConsume: [items[0]] };
        }
      }
      continue;
    }

    // Check if all specific ingredients are available
    // Track how many of each type we need (ingredients may list same type multiple times)
    const needed = new Map<ItemType, number>();
    for (const ing of recipe.ingredients) {
      needed.set(ing.itemType, (needed.get(ing.itemType) ?? 0) + ing.count);
    }

    let canMake = true;
    const itemsToConsume: FoundIngredient[] = [];

    for (const [itemType, count] of needed) {
      const available = nearbyFood.get(itemType);
      if (!available || available.length < count) {
        canMake = false;
        break;
      }
      for (let i = 0; i < count; i++) {
        itemsToConsume.push(available[i]);
      }
    }

    if (canMake) {
      return { recipe, itemsToConsume };
    }
  }

  return null;
}

// =============================================================================
// COOKING SYSTEM CLASS
// =============================================================================

export class CookingSystem {
  private ticksSinceLastCheck = 0;

  constructor(
    private entityStore: EntityStore,
    private jobProcessor: JobProcessor,
    private getWorld: () => World | null,
  ) {}

  update(): void {
    this.ticksSinceLastCheck++;
    if (this.ticksSinceLastCheck < CHECK_INTERVAL) return;
    this.ticksSinceLastCheck = 0;

    const world = this.getWorld();
    if (!world) return;

    const campfires = this.findWorkstations(world, "campfire");
    let jobsAssigned = 0;
    const assignedCharacters = new Set<EntityId>();

    const campfireRecipes = getRecipesForWorkstation("campfire");

    for (const campfirePos of campfires) {
      if (jobsAssigned >= MAX_JOBS_PER_SCAN) break;

      if (this.jobProcessor.reservations.isReserved(campfirePos)) continue;

      // Gather all nearby raw food grouped by type
      const nearbyFood = this.gatherNearbyRawFood(world, campfirePos);
      if (nearbyFood.size === 0) continue;

      // Find eligible cooks sorted by priority/skill/distance
      const eligible = getEligibleCharacters(
        this.entityStore.values(),
        "cooking",
        campfirePos,
        (id) =>
          assignedCharacters.has(id) ||
          this.jobProcessor.getJob(id) !== undefined,
      );

      // Try each eligible cook — higher-skilled cooks can make better meals
      let assigned = false;
      for (const candidate of eligible) {
        const character = this.entityStore.get(candidate.id);
        if (!character) continue;

        const result = selectRecipe(
          campfireRecipes,
          candidate.skillLevel,
          nearbyFood,
        );
        if (!result) continue;

        // Remove consumed ingredients from tiles
        for (const ing of result.itemsToConsume) {
          const tile = getWorldTileAt(
            world,
            ing.position.x,
            ing.position.y,
            ing.position.z,
          );
          if (tile) {
            removeItemFromTile(tile, ing.item.id);
          }
        }

        // Also remove from nearbyFood so subsequent recipes don't reuse them
        for (const ing of result.itemsToConsume) {
          const items = nearbyFood.get(ing.item.type as ItemType);
          if (items) {
            const idx = items.findIndex((i) => i.item.id === ing.item.id);
            if (idx !== -1) items.splice(idx, 1);
          }
        }

        const job = createCookJob(
          candidate.id,
          campfirePos,
          result.recipe.output.itemType,
          result.recipe.workTicks,
        );
        this.jobProcessor.assignJob(job);
        assignedCharacters.add(candidate.id);
        jobsAssigned++;
        assigned = true;
        break;
      }

      if (!assigned) continue;
    }

    // Assign nutrient paste dispenser jobs (no raw food needed)
    const dispensers = this.findWorkstations(world, "nutrient_paste_dispenser");
    for (const dispenserPos of dispensers) {
      if (jobsAssigned >= MAX_JOBS_PER_SCAN) break;

      if (this.jobProcessor.reservations.isReserved(dispenserPos)) continue;

      const eligible = getEligibleCharacters(
        this.entityStore.values(),
        "cooking",
        dispenserPos,
        (id) =>
          assignedCharacters.has(id) ||
          this.jobProcessor.getJob(id) !== undefined,
      );
      if (eligible.length === 0) continue;

      const job = createDispenserJob(eligible[0].id, dispenserPos);
      this.jobProcessor.assignJob(job);
      assignedCharacters.add(eligible[0].id);
      jobsAssigned++;
    }
  }

  /**
   * Find all positions of a given structure type in the world.
   */
  private findWorkstations(world: World, structureType: string): Position3D[] {
    const positions: Position3D[] = [];

    for (const [z, level] of world.levels) {
      for (let y = 0; y < level.height; y++) {
        for (let x = 0; x < level.width; x++) {
          const tile = level.tiles[y * level.width + x];
          if (tile?.structure?.type === structureType) {
            positions.push({ x, y, z });
          }
        }
      }
    }

    return positions;
  }

  /**
   * Gather all raw food items within search radius of a position, grouped by item type.
   */
  private gatherNearbyRawFood(
    world: World,
    center: Position3D,
  ): Map<ItemType, FoundIngredient[]> {
    const result = new Map<ItemType, FoundIngredient[]>();
    const level = world.levels.get(center.z);
    if (!level) return result;

    const minX = Math.max(0, center.x - FOOD_SEARCH_RADIUS);
    const maxX = Math.min(level.width - 1, center.x + FOOD_SEARCH_RADIUS);
    const minY = Math.max(0, center.y - FOOD_SEARCH_RADIUS);
    const maxY = Math.min(level.height - 1, center.y + FOOD_SEARCH_RADIUS);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const tile = getWorldTileAt(world, x, y, center.z);
        if (!tile || tile.items.length === 0) continue;

        for (const item of tile.items) {
          if (!isRawFood(item.type)) continue;

          const itemType = item.type as ItemType;
          let list = result.get(itemType);
          if (!list) {
            list = [];
            result.set(itemType, list);
          }
          list.push({
            position: { x, y, z: center.z },
            item,
          });
        }
      }
    }

    return result;
  }
}
