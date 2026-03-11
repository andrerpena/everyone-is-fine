// =============================================================================
// HARVESTING SYSTEM
// =============================================================================
// Periodically scans tiles for mature crops and assigns harvest jobs to idle
// colonists to gather the yield.

import type { Position3D, World } from "../../world/types";
import type { EntityStore } from "../entity-store";
import type { EntityId } from "../types";
import { pickBestCharacter } from "../work-priorities";
import { createHarvestJob } from "./job-factory";
import type { JobProcessor } from "./job-processor";

// =============================================================================
// CONSTANTS
// =============================================================================

/** How often (in ticks) the harvesting system scans for work */
const CHECK_INTERVAL = 120;

/** Maximum harvest jobs to assign per scan */
const MAX_JOBS_PER_SCAN = 3;

// =============================================================================
// HARVESTING SYSTEM CLASS
// =============================================================================

export class HarvestingSystem {
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

    let jobsAssigned = 0;
    const assignedCharacters = new Set<EntityId>();

    for (const [zLevel, level] of world.levels) {
      if (jobsAssigned >= MAX_JOBS_PER_SCAN) break;

      for (let y = 0; y < level.height; y++) {
        if (jobsAssigned >= MAX_JOBS_PER_SCAN) break;

        for (let x = 0; x < level.width; x++) {
          if (jobsAssigned >= MAX_JOBS_PER_SCAN) break;

          const tile = level.tiles[y * level.width + x];
          if (!tile.crop || tile.crop.stage !== "mature") continue;

          const pos: Position3D = { x, y, z: zLevel };

          // Skip reserved tiles
          if (this.jobProcessor.reservations.isReserved(pos)) continue;

          const charId = pickBestCharacter(
            this.entityStore.values(),
            "growing",
            pos,
            (id) =>
              assignedCharacters.has(id) ||
              this.jobProcessor.getJob(id) !== undefined,
          );
          if (!charId) continue;

          const job = createHarvestJob(charId, pos, tile.crop.type);
          this.jobProcessor.assignJob(job);
          assignedCharacters.add(charId);
          jobsAssigned++;
        }
      }
    }
  }
}
