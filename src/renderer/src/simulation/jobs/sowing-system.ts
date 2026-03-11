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
import { pickBestCharacter } from "../work-priorities";
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

    let jobsAssigned = 0;
    const assignedCharacters = new Set<EntityId>();

    for (const zone of growingZones) {
      if (jobsAssigned >= MAX_JOBS_PER_SCAN) break;

      const cropType = zone.cropType;
      if (!cropType) continue;

      for (const tileKey of zone.tiles) {
        if (jobsAssigned >= MAX_JOBS_PER_SCAN) break;

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

        const charId = pickBestCharacter(
          this.entityStore.values(),
          "growing",
          pos,
          (id) =>
            assignedCharacters.has(id) ||
            this.jobProcessor.getJob(id) !== undefined,
        );
        if (!charId) continue;

        const job = createSowJob(charId, pos, cropType);
        this.jobProcessor.assignJob(job);
        assignedCharacters.add(charId);
        jobsAssigned++;
      }
    }
  }

  private getGrowingZones(): ZoneData[] {
    return useZoneStore
      .getState()
      .getAllZones()
      .filter((z) => z.type === "growing");
  }
}
