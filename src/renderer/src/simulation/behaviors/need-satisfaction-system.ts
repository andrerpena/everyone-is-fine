// =============================================================================
// NEED SATISFACTION SYSTEM
// =============================================================================
// Unified system that checks all colonist needs and addresses the most
// critical one first. Replaces separate ForageBehavior and SleepBehavior.

import { ITEM_REGISTRY } from "../../world/registries/item-registry";
import type { World } from "../../world/types";
import { getWorldTileAt } from "../../world/utils/tile-utils";
import type { EntityStore } from "../entity-store";
import type { JobProcessor } from "../jobs";
import {
  createEatJob,
  createForageJob,
  createRelaxJob,
  createSleepJob,
  createSocializeJob,
} from "../jobs/job-factory";
import { getNeedThreshold } from "../needs/needs-config";
import { getScheduledActivity } from "../schedule";
import type { Character } from "../types";

// =============================================================================
// CONSTANTS
// =============================================================================

/** Need level at which colonists will seek to satisfy a need */
const NEED_THRESHOLD = 0.3;

/** Maximum distance (in tiles) to search for a bush */
const FORAGE_SEARCH_RADIUS = 20;

/** Maximum distance (in tiles) to search for a bed */
const BED_SEARCH_RADIUS = 30;

/** Maximum distance (in tiles) to search for another colonist to socialize with */
const SOCIALIZE_SEARCH_RADIUS = 25;

/** Threshold for proactive need satisfaction during scheduled activity hours (higher than critical) */
const SCHEDULE_PROACTIVE_THRESHOLD = 0.8;

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
        // Never interrupt need-satisfying jobs
        if (
          activeJob.type === "forage" ||
          activeJob.type === "eat" ||
          activeJob.type === "sleep" ||
          activeJob.type === "relax" ||
          activeJob.type === "socialize"
        )
          continue;

        // Interrupt non-essential jobs only when a need is critical
        const hasCriticalNeed =
          getNeedThreshold(character.needs.hunger) === "critical" ||
          getNeedThreshold(character.needs.energy) === "critical" ||
          getNeedThreshold(character.needs.comfort) === "critical";
        if (!hasCriticalNeed) continue;

        // Cancel the current job so the colonist can address the critical need
        this.jobProcessor.cancelJob(character.id);
      }

      if (character.movement.isMoving) continue;

      // Check the schedule to determine behavior
      const world = this.getWorld();
      const currentHour = world?.time.hour ?? 12;
      const scheduledActivity = getScheduledActivity(
        character.schedule,
        currentHour,
      );

      // Determine action based on schedule and needs
      const action = this.getActionForSchedule(character, scheduledActivity);
      if (!action) continue;

      switch (action) {
        case "forage":
          // Prefer eating food items over foraging bushes
          if (!this.tryEat(character)) {
            this.tryForage(character);
          }
          break;
        case "sleep":
          this.trySleep(character);
          break;
        case "relax":
          this.tryRelax(character);
          break;
        case "socialize":
          this.trySocialize(character);
          break;
      }
    }
  }

  /**
   * Determine which need-satisfying action is most urgent.
   * Returns null if no needs are below threshold.
   * Priority: hunger/energy (whichever is lower) > comfort > recreation > social
   */
  private getMostUrgentAction(
    character: Character,
  ): "forage" | "sleep" | "relax" | "socialize" | null {
    const { hunger, energy, comfort, recreation, social } = character.needs;

    const hungerLow = hunger < NEED_THRESHOLD;
    const energyLow = energy < NEED_THRESHOLD;
    const comfortLow = comfort < NEED_THRESHOLD;
    const recreationLow = recreation < NEED_THRESHOLD;
    const socialLow = social < NEED_THRESHOLD;

    // Check hunger and energy first (vital needs)
    if (hungerLow && energyLow) {
      return hunger <= energy ? "forage" : "sleep";
    }
    if (hungerLow) return "forage";
    if (energyLow) return "sleep";

    // Comfort is lower priority — satisfied by sleeping (preferably on a bed)
    if (comfortLow) return "sleep";

    // Recreation — satisfied by relaxing
    if (recreationLow) return "relax";

    // Social is lowest priority — satisfied by socializing with another colonist
    if (socialLow) return "socialize";

    return null;
  }

  /**
   * Determine the action based on the character's schedule and needs.
   *
   * - "work": Only satisfy critical needs; otherwise let auto-assignment systems handle work
   * - "sleep": Proactively sleep if energy < 0.8; also satisfy critical hunger
   * - "recreation": Proactively relax/socialize if recreation/social < 0.8; also satisfy critical needs
   * - "anything": Use standard need-based behavior (getMostUrgentAction)
   */
  private getActionForSchedule(
    character: Character,
    activity: string,
  ): "forage" | "sleep" | "relax" | "socialize" | null {
    const { hunger, energy, recreation, social } = character.needs;

    // Critical needs always take priority regardless of schedule
    const hungerCritical = hunger < NEED_THRESHOLD;
    const energyCritical = energy < NEED_THRESHOLD;

    switch (activity) {
      case "work":
        // During work hours, only satisfy critical needs
        if (hungerCritical && energyCritical) {
          return hunger <= energy ? "forage" : "sleep";
        }
        if (hungerCritical) return "forage";
        if (energyCritical) return "sleep";
        return null;

      case "sleep":
        // Critical hunger still takes priority over scheduled sleep
        if (hungerCritical) return "forage";
        // Proactively sleep when energy is below 0.8 (not just critical)
        if (energy < SCHEDULE_PROACTIVE_THRESHOLD) return "sleep";
        return null;

      case "recreation":
        // Critical needs still take priority
        if (hungerCritical && energyCritical) {
          return hunger <= energy ? "forage" : "sleep";
        }
        if (hungerCritical) return "forage";
        if (energyCritical) return "sleep";
        // Proactively relax/socialize when below threshold
        if (
          recreation < SCHEDULE_PROACTIVE_THRESHOLD &&
          social < SCHEDULE_PROACTIVE_THRESHOLD
        ) {
          return recreation <= social ? "relax" : "socialize";
        }
        if (recreation < SCHEDULE_PROACTIVE_THRESHOLD) return "relax";
        if (social < SCHEDULE_PROACTIVE_THRESHOLD) return "socialize";
        return null;

      default:
        // "anything" — use standard need-based behavior
        return this.getMostUrgentAction(character);
    }
  }

  /**
   * Find nearest food item on the ground and assign an eat job.
   * Returns true if a food item was found and a job assigned.
   */
  private tryEat(character: Character): boolean {
    const world = this.getWorld();
    if (!world) return false;

    const { position } = character;
    const level = world.levels.get(position.z);
    if (!level) return false;

    let bestDist = Number.POSITIVE_INFINITY;
    let bestPos: { x: number; y: number; z: number } | null = null;
    let bestItemId: string | null = null;

    const minX = Math.max(0, position.x - FORAGE_SEARCH_RADIUS);
    const maxX = Math.min(level.width - 1, position.x + FORAGE_SEARCH_RADIUS);
    const minY = Math.max(0, position.y - FORAGE_SEARCH_RADIUS);
    const maxY = Math.min(level.height - 1, position.y + FORAGE_SEARCH_RADIUS);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const tile = getWorldTileAt(world, x, y, position.z);
        if (!tile || tile.items.length === 0) continue;

        const candidate = { x, y, z: position.z };
        if (this.jobProcessor.reservations.isReserved(candidate)) continue;

        // Find a food item on this tile
        for (const item of tile.items) {
          const props = ITEM_REGISTRY[item.type];
          if (props.nutrition <= 0) continue;

          const dist = Math.abs(x - position.x) + Math.abs(y - position.y);
          if (dist < bestDist) {
            bestDist = dist;
            bestPos = candidate;
            bestItemId = item.id;
          }
          break; // Only consider first food item per tile
        }
      }
    }

    if (!bestPos || !bestItemId) return false;

    const job = createEatJob(character.id, bestPos, bestItemId);
    this.jobProcessor.assignJob(job);
    return true;
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
   * Sleep to restore energy and comfort.
   * Searches for a nearby unoccupied bed first; falls back to sleeping on the ground.
   */
  private trySleep(character: Character): void {
    const bedPos = this.findNearestBed(character);
    if (bedPos) {
      const job = createSleepJob(character.id, bedPos, true);
      this.jobProcessor.assignJob(job);
    } else {
      const job = createSleepJob(character.id, character.position, false);
      this.jobProcessor.assignJob(job);
    }
  }

  /**
   * Socialize with a nearby idle colonist to restore social need.
   */
  private trySocialize(character: Character): void {
    let bestDist = Number.POSITIVE_INFINITY;
    let bestTarget: Character | null = null;

    for (const other of this.entityStore.values()) {
      if (other.id === character.id) continue;
      if (other.position.z !== character.position.z) continue;
      // Prefer idle colonists, but allow socializing with any colonist
      if (other.mentalBreak !== null) continue;

      const dist =
        Math.abs(other.position.x - character.position.x) +
        Math.abs(other.position.y - character.position.y);
      if (dist > SOCIALIZE_SEARCH_RADIUS) continue;
      if (dist < bestDist) {
        bestDist = dist;
        bestTarget = other;
      }
    }

    if (!bestTarget) return;

    const job = createSocializeJob(character.id, bestTarget.position);
    this.jobProcessor.assignJob(job);
  }

  /**
   * Relax at the current position to restore recreation.
   */
  private tryRelax(character: Character): void {
    const job = createRelaxJob(character.id, character.position);
    this.jobProcessor.assignJob(job);
  }

  /**
   * Find the nearest unoccupied bed within search radius.
   */
  private findNearestBed(
    character: Character,
  ): { x: number; y: number; z: number } | null {
    const world = this.getWorld();
    if (!world) return null;

    const { position } = character;
    const level = world.levels.get(position.z);
    if (!level) return null;

    let bestDist = Number.POSITIVE_INFINITY;
    let bestPos: { x: number; y: number; z: number } | null = null;

    const minX = Math.max(0, position.x - BED_SEARCH_RADIUS);
    const maxX = Math.min(level.width - 1, position.x + BED_SEARCH_RADIUS);
    const minY = Math.max(0, position.y - BED_SEARCH_RADIUS);
    const maxY = Math.min(level.height - 1, position.y + BED_SEARCH_RADIUS);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const tile = getWorldTileAt(world, x, y, position.z);
        if (!tile || tile.structure?.type !== "bed") continue;

        const candidate = { x, y, z: position.z };
        if (this.jobProcessor.reservations.isReserved(candidate)) continue;

        const dist = Math.abs(x - position.x) + Math.abs(y - position.y);
        if (dist < bestDist) {
          bestDist = dist;
          bestPos = candidate;
        }
      }
    }

    return bestPos;
  }
}
