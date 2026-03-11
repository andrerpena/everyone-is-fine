// =============================================================================
// NEED SATISFACTION SYSTEM
// =============================================================================
// Unified system that checks all colonist needs and addresses the most
// critical one first. Replaces separate ForageBehavior and SleepBehavior.

import type { World } from "../../world/types";
import { getWorldTileAt } from "../../world/utils/tile-utils";
import type { EntityStore } from "../entity-store";
import type { JobProcessor } from "../jobs";
import { createForageJob, createSleepJob } from "../jobs/job-factory";
import { getNeedThreshold } from "../needs/needs-config";
import type { Character } from "../types";

// =============================================================================
// CONSTANTS
// =============================================================================

/** Need level at which colonists will seek to satisfy a need */
const NEED_THRESHOLD = 0.3;

/** Maximum distance (in tiles) to search for a bush */
const FORAGE_SEARCH_RADIUS = 20;

// =============================================================================
// NEED SATISFACTION SYSTEM
// =============================================================================

export class NeedSatisfactionSystem {
  constructor(
    private entityStore: EntityStore,
    private jobProcessor: JobProcessor,
    private getWorld: () => World | null,
  ) {}

  update(): void {
    for (const character of this.entityStore.values()) {
      // Standard guards: skip characters that shouldn't auto-act
      if (character.control.mode === "drafted") continue;
      if (character.mentalBreak !== null) continue;

      // If the character has an active job, check if a critical need should interrupt it
      const activeJob = this.jobProcessor.getJob(character.id);
      if (activeJob) {
        // Never interrupt need-satisfying jobs (forage, sleep)
        if (activeJob.type === "forage" || activeJob.type === "sleep") continue;

        // Interrupt non-essential jobs only when a need is critical
        const hasCriticalNeed =
          getNeedThreshold(character.needs.hunger) === "critical" ||
          getNeedThreshold(character.needs.energy) === "critical";
        if (!hasCriticalNeed) continue;

        // Cancel the current job so the colonist can address the critical need
        this.jobProcessor.cancelJob(character.id);
      }

      if (character.movement.isMoving) continue;

      // Find the most urgent unsatisfied need
      const action = this.getMostUrgentAction(character);
      if (!action) continue;

      switch (action) {
        case "forage":
          this.tryForage(character);
          break;
        case "sleep":
          this.trySleep(character);
          break;
      }
    }
  }

  /**
   * Determine which need-satisfying action is most urgent.
   * Returns null if no needs are below threshold.
   */
  private getMostUrgentAction(character: Character): "forage" | "sleep" | null {
    const { hunger, energy } = character.needs;

    const hungerLow = hunger < NEED_THRESHOLD;
    const energyLow = energy < NEED_THRESHOLD;

    if (!hungerLow && !energyLow) return null;
    if (hungerLow && !energyLow) return "forage";
    if (!hungerLow && energyLow) return "sleep";

    // Both are low — address the more critical (lower value) first
    return hunger <= energy ? "forage" : "sleep";
  }

  /**
   * Find nearest bush and assign a forage job.
   */
  private tryForage(character: Character): void {
    const world = this.getWorld();
    if (!world) return;

    const { position } = character;
    const level = world.levels.get(position.z);
    if (!level) return;

    let bestDist = Number.POSITIVE_INFINITY;
    let bestPos: { x: number; y: number; z: number } | null = null;

    const minX = Math.max(0, position.x - FORAGE_SEARCH_RADIUS);
    const maxX = Math.min(level.width - 1, position.x + FORAGE_SEARCH_RADIUS);
    const minY = Math.max(0, position.y - FORAGE_SEARCH_RADIUS);
    const maxY = Math.min(level.height - 1, position.y + FORAGE_SEARCH_RADIUS);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const tile = getWorldTileAt(world, x, y, position.z);
        if (!tile || tile.structure?.type !== "bush") continue;

        // Skip tiles already reserved by another colonist
        const candidate = { x, y, z: position.z };
        if (this.jobProcessor.reservations.isReserved(candidate)) continue;

        const dist = Math.abs(x - position.x) + Math.abs(y - position.y);
        if (dist < bestDist) {
          bestDist = dist;
          bestPos = candidate;
        }
      }
    }

    if (!bestPos) return;

    const job = createForageJob(character.id, bestPos);
    this.jobProcessor.assignJob(job);
  }

  /**
   * Sleep in place to restore energy.
   */
  private trySleep(character: Character): void {
    const job = createSleepJob(character.id, character.position);
    this.jobProcessor.assignJob(job);
  }
}
