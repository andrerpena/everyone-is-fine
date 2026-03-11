// =============================================================================
// CONSTRUCTION SYSTEM
// =============================================================================
// Auto-assigns build jobs for tiles with blueprints.
// Scans all world tiles for blueprints and assigns idle colonists to build them.

import type { World } from "../../world/types";
import type { EntityStore } from "../entity-store";
import type { Character } from "../types";
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

    // Find idle colonists
    const idleColonists: Character[] = [];
    for (const character of this.entityStore.values()) {
      if (character.control.mode === "drafted") continue;
      if (character.mentalBreak !== null) continue;
      if (this.jobProcessor.getJob(character.id)) continue;
      if (character.movement.isMoving) continue;
      idleColonists.push(character);
    }

    if (idleColonists.length === 0) return;

    let jobsAssigned = 0;

    for (const level of world.levels.values()) {
      if (jobsAssigned >= MAX_JOBS_PER_SCAN) break;
      if (idleColonists.length === 0) break;

      for (let y = 0; y < level.height; y++) {
        for (let x = 0; x < level.width; x++) {
          if (jobsAssigned >= MAX_JOBS_PER_SCAN) break;
          if (idleColonists.length === 0) break;

          const tile = level.tiles[y * level.width + x];
          if (!tile.blueprint) continue;
          if (tile.structure !== null) continue;

          const pos = { x, y, z: level.z };
          if (this.jobProcessor.reservations.isReserved(pos)) continue;

          // Find closest idle colonist
          let bestIdx = -1;
          let bestDist = Number.POSITIVE_INFINITY;
          for (let i = 0; i < idleColonists.length; i++) {
            const c = idleColonists[i];
            if (c.position.z !== level.z) continue;
            const dist =
              Math.abs(c.position.x - x) + Math.abs(c.position.y - y);
            if (dist < bestDist) {
              bestDist = dist;
              bestIdx = i;
            }
          }

          if (bestIdx === -1) continue;

          const colonist = idleColonists[bestIdx];
          const job = createBuildJob(colonist.id, pos, tile.blueprint.type);
          this.jobProcessor.assignJob(job);
          idleColonists.splice(bestIdx, 1);
          jobsAssigned++;
        }
      }
    }
  }
}
