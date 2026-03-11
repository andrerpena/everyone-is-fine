// =============================================================================
// FORAGE BEHAVIOR SYSTEM
// =============================================================================
// When a colonist's hunger drops below a threshold, autonomously seek the
// nearest berry bush and create a forage job to restore hunger.

import type { World } from "../../world/types";
import { getWorldTileAt } from "../../world/utils/tile-utils";
import type { EntityStore } from "../entity-store";
import type { JobProcessor } from "../jobs";
import { createForageJob } from "../jobs/job-factory";

// =============================================================================
// CONSTANTS
// =============================================================================

/** Hunger level at which colonists will seek food */
const HUNGER_THRESHOLD = 0.3;

/** Maximum distance (in tiles) to search for a bush */
const SEARCH_RADIUS = 20;

// =============================================================================
// FORAGE BEHAVIOR SYSTEM
// =============================================================================

export class ForageBehavior {
  constructor(
    private entityStore: EntityStore,
    private jobProcessor: JobProcessor,
    private getWorld: () => World | null,
  ) {}

  update(): void {
    for (const character of this.entityStore.values()) {
      // Skip drafted colonists
      if (character.control.mode === "drafted") continue;

      // Skip colonists in mental break
      if (character.mentalBreak !== null) continue;

      // Skip colonists that already have a job
      if (this.jobProcessor.getJob(character.id)) continue;

      // Skip colonists currently moving
      if (character.movement.isMoving) continue;

      // Only forage when hungry
      if (character.needs.hunger >= HUNGER_THRESHOLD) continue;

      // Find nearest bush
      const world = this.getWorld();
      if (!world) continue;

      const { position } = character;
      const level = world.levels.get(position.z);
      if (!level) continue;

      let bestDist = Number.POSITIVE_INFINITY;
      let bestPos: { x: number; y: number; z: number } | null = null;

      const minX = Math.max(0, position.x - SEARCH_RADIUS);
      const maxX = Math.min(level.width - 1, position.x + SEARCH_RADIUS);
      const minY = Math.max(0, position.y - SEARCH_RADIUS);
      const maxY = Math.min(level.height - 1, position.y + SEARCH_RADIUS);

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const tile = getWorldTileAt(world, x, y, position.z);
          if (!tile || tile.structure?.type !== "bush") continue;

          const dist = Math.abs(x - position.x) + Math.abs(y - position.y);
          if (dist < bestDist) {
            bestDist = dist;
            bestPos = { x, y, z: position.z };
          }
        }
      }

      if (!bestPos) continue;

      // Assign forage job
      const job = createForageJob(character.id, bestPos);
      this.jobProcessor.assignJob(job);
    }
  }
}
