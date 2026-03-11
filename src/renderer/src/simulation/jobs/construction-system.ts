// =============================================================================
// CONSTRUCTION SYSTEM
// =============================================================================
// Auto-assigns build jobs for tiles with blueprints.
// Scans all world tiles for blueprints and assigns idle colonists to build them.

import type { World } from "../../world/types";
import type { EntityStore } from "../entity-store";
import type { EntityId } from "../types";
import { pickBestCharacter } from "../work-priorities";
import { createBuildJob } from "./job-factory";
import type { JobProcessor } from "./job-processor";

/** How often (in ticks) the system scans for blueprints */
const CHECK_INTERVAL = 120;

/** Max build jobs to assign per scan */
const MAX_JOBS_PER_SCAN = 3;

export class ConstructionSystem {
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

    for (const level of world.levels.values()) {
      if (jobsAssigned >= MAX_JOBS_PER_SCAN) break;

      for (let y = 0; y < level.height; y++) {
        for (let x = 0; x < level.width; x++) {
          if (jobsAssigned >= MAX_JOBS_PER_SCAN) break;

          const tile = level.tiles[y * level.width + x];
          if (!tile.blueprint) continue;
          if (tile.structure !== null) continue;

          const pos = { x, y, z: level.z };
          if (this.jobProcessor.reservations.isReserved(pos)) continue;

          const charId = pickBestCharacter(
            this.entityStore.values(),
            "construction",
            pos,
            (id) =>
              assignedCharacters.has(id) ||
              this.jobProcessor.getJob(id) !== undefined,
          );
          if (!charId) continue;

          const job = createBuildJob(charId, pos, tile.blueprint.type);
          this.jobProcessor.assignJob(job);
          assignedCharacters.add(charId);
          jobsAssigned++;
        }
      }
    }
  }
}
