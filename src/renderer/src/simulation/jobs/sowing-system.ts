// =============================================================================
// SOWING SYSTEM
// =============================================================================
// Periodically scans growing zones for empty fertile tiles and assigns sow
// jobs to idle colonists to plant crops.

import { TERRAIN_REGISTRY } from "../../world/registries/terrain-registry";
import type { Position3D, World } from "../../world/types";
import type { ZoneData } from "../../zones/types";
import { useZoneStore } from "../../zones/zone-store";
import type { EntityStore } from "../entity-store";
import type { EntityId } from "../types";
import { createSowJob } from "./job-factory";
import type { JobProcessor } from "./job-processor";

// =============================================================================
// CONSTANTS
// =============================================================================

/** How often (in ticks) the sowing system scans for work */
const CHECK_INTERVAL = 120;

/** Maximum sow jobs to assign per scan */
const MAX_JOBS_PER_SCAN = 3;

// =============================================================================
// SOWING SYSTEM CLASS
// =============================================================================

export class SowingSystem {
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

    const growingZones = this.getGrowingZones();
    if (growingZones.length === 0) return;

    const idleCharacters = this.getIdleCharacters();
    if (idleCharacters.length === 0) return;

    let jobsAssigned = 0;

    for (const zone of growingZones) {
      if (jobsAssigned >= MAX_JOBS_PER_SCAN) break;
      if (idleCharacters.length === 0) break;

      const cropType = zone.cropType;
      if (!cropType) continue;

      for (const tileKey of zone.tiles) {
        if (jobsAssigned >= MAX_JOBS_PER_SCAN) break;
        if (idleCharacters.length === 0) break;

        const [xStr, yStr] = tileKey.split(",");
        const x = Number(xStr);
        const y = Number(yStr);
        const pos: Position3D = { x, y, z: zone.zLevel };

        // Skip reserved tiles
        if (this.jobProcessor.reservations.isReserved(pos)) continue;

        // Get tile and check conditions
        const level = world.levels.get(zone.zLevel);
        if (!level) continue;
        const tile = level.tiles[y * level.width + x];
        if (!tile) continue;

        // Skip tiles that already have a crop
        if (tile.crop) continue;

        // Skip non-passable tiles
        if (!tile.pathfinding.isPassable) continue;

        // Skip tiles with no fertility
        const terrainProps = TERRAIN_REGISTRY[tile.terrain.type];
        if (terrainProps.fertility <= 0) continue;

        // Pick closest idle colonist
        const charId = this.pickClosestCharacter(idleCharacters, pos);
        if (!charId) continue;

        const job = createSowJob(charId, pos, cropType);
        this.jobProcessor.assignJob(job);
        jobsAssigned++;

        // Remove from idle pool
        const idx = idleCharacters.indexOf(charId);
        if (idx !== -1) idleCharacters.splice(idx, 1);
      }
    }
  }

  private getGrowingZones(): ZoneData[] {
    return useZoneStore
      .getState()
      .getAllZones()
      .filter((z) => z.type === "growing");
  }

  private getIdleCharacters(): EntityId[] {
    const idle: EntityId[] = [];
    for (const character of this.entityStore.values()) {
      if (character.mentalBreak !== null) continue;
      if (character.control.mode !== "idle") continue;
      if (character.movement.isMoving) continue;
      if (this.jobProcessor.getJob(character.id)) continue;
      idle.push(character.id);
    }
    return idle;
  }

  private pickClosestCharacter(
    idleCharacters: EntityId[],
    target: Position3D,
  ): EntityId | null {
    let best: EntityId | null = null;
    let bestDist = Number.POSITIVE_INFINITY;

    for (const id of idleCharacters) {
      const char = this.entityStore.get(id);
      if (!char) continue;

      const dist =
        Math.abs(char.position.x - target.x) +
        Math.abs(char.position.y - target.y);
      if (dist < bestDist) {
        bestDist = dist;
        best = id;
      }
    }

    return best;
  }
}
