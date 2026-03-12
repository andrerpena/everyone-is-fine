// =============================================================================
// COOKING SYSTEM
// =============================================================================
// Periodically scans for campfires with nearby raw food and assigns cook
// jobs to idle colonists to produce simple meals.

import { ITEM_REGISTRY } from "../../world/registries/item-registry";
import type { ItemData, Position3D, World } from "../../world/types";
import {
  getWorldTileAt,
  removeItemFromTile,
} from "../../world/utils/tile-utils";
import type { EntityStore } from "../entity-store";
import type { EntityId } from "../types";
import { pickBestCharacter } from "../work-priorities";
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

/** Item categories/types considered raw food for cooking */
function isRawFood(itemType: string): boolean {
  const props = ITEM_REGISTRY[itemType as keyof typeof ITEM_REGISTRY];
  if (!props) return false;
  // Raw food has nutrition > 0 and is not already a meal
  return (
    props.nutrition > 0 &&
    props.category === "food" &&
    !itemType.startsWith("meal_")
  );
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

    const campfires = this.findCampfires(world);
    if (campfires.length === 0) return;

    let jobsAssigned = 0;
    const assignedCharacters = new Set<EntityId>();

    for (const campfirePos of campfires) {
      if (jobsAssigned >= MAX_JOBS_PER_SCAN) break;

      // Skip if campfire tile is already reserved
      if (this.jobProcessor.reservations.isReserved(campfirePos)) continue;

      // Find raw food near this campfire
      const foodResult = this.findNearbyRawFood(world, campfirePos);
      if (!foodResult) continue;

      const charId = pickBestCharacter(
        this.entityStore.values(),
        "cooking",
        campfirePos,
        (id) =>
          assignedCharacters.has(id) ||
          this.jobProcessor.getJob(id) !== undefined,
      );
      if (!charId) continue;

      // Remove the raw food item from the tile before assigning the job
      const foodTile = getWorldTileAt(
        world,
        foodResult.position.x,
        foodResult.position.y,
        foodResult.position.z,
      );
      if (!foodTile) continue;
      removeItemFromTile(foodTile, foodResult.item.id);

      const job = createCookJob(charId, campfirePos);
      this.jobProcessor.assignJob(job);
      assignedCharacters.add(charId);
      jobsAssigned++;
    }

    // Assign nutrient paste dispenser jobs (no raw food needed)
    const dispensers = this.findDispensers(world);
    for (const dispenserPos of dispensers) {
      if (jobsAssigned >= MAX_JOBS_PER_SCAN) break;

      if (this.jobProcessor.reservations.isReserved(dispenserPos)) continue;

      const charId = pickBestCharacter(
        this.entityStore.values(),
        "cooking",
        dispenserPos,
        (id) =>
          assignedCharacters.has(id) ||
          this.jobProcessor.getJob(id) !== undefined,
      );
      if (!charId) continue;

      const job = createDispenserJob(charId, dispenserPos);
      this.jobProcessor.assignJob(job);
      assignedCharacters.add(charId);
      jobsAssigned++;
    }
  }

  /**
   * Find all campfire positions in the world.
   */
  private findCampfires(world: World): Position3D[] {
    const campfires: Position3D[] = [];

    for (const [z, level] of world.levels) {
      for (let y = 0; y < level.height; y++) {
        for (let x = 0; x < level.width; x++) {
          const tile = level.tiles[y * level.width + x];
          if (tile?.structure?.type === "campfire") {
            campfires.push({ x, y, z });
          }
        }
      }
    }

    return campfires;
  }

  /**
   * Find all nutrient paste dispenser positions in the world.
   */
  private findDispensers(world: World): Position3D[] {
    const dispensers: Position3D[] = [];

    for (const [z, level] of world.levels) {
      for (let y = 0; y < level.height; y++) {
        for (let x = 0; x < level.width; x++) {
          const tile = level.tiles[y * level.width + x];
          if (tile?.structure?.type === "nutrient_paste_dispenser") {
            dispensers.push({ x, y, z });
          }
        }
      }
    }

    return dispensers;
  }

  /**
   * Find the nearest raw food item within search radius of a campfire.
   */
  private findNearbyRawFood(
    world: World,
    campfirePos: Position3D,
  ): { position: Position3D; item: ItemData } | null {
    const level = world.levels.get(campfirePos.z);
    if (!level) return null;

    let bestDist = Number.POSITIVE_INFINITY;
    let bestResult: { position: Position3D; item: ItemData } | null = null;

    const minX = Math.max(0, campfirePos.x - FOOD_SEARCH_RADIUS);
    const maxX = Math.min(level.width - 1, campfirePos.x + FOOD_SEARCH_RADIUS);
    const minY = Math.max(0, campfirePos.y - FOOD_SEARCH_RADIUS);
    const maxY = Math.min(level.height - 1, campfirePos.y + FOOD_SEARCH_RADIUS);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const tile = getWorldTileAt(world, x, y, campfirePos.z);
        if (!tile || tile.items.length === 0) continue;

        for (const item of tile.items) {
          if (!isRawFood(item.type)) continue;

          const dist =
            Math.abs(x - campfirePos.x) + Math.abs(y - campfirePos.y);
          if (dist < bestDist) {
            bestDist = dist;
            bestResult = {
              position: { x, y, z: campfirePos.z },
              item,
            };
          }
          break; // Only check first food item per tile
        }
      }
    }

    return bestResult;
  }
}
