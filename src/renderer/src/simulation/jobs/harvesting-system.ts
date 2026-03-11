// =============================================================================
// HARVESTING SYSTEM
// =============================================================================
// Periodically scans tiles for mature crops and assigns harvest jobs to idle
// colonists to gather the yield.

import type { Position3D, World } from "../../world/types";
import type { EntityStore } from "../entity-store";
import type { EntityId } from "../types";
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

    const idleCharacters = this.getIdleCharacters();
    if (idleCharacters.length === 0) return;

    let jobsAssigned = 0;

    for (const [zLevel, level] of world.levels) {
      if (jobsAssigned >= MAX_JOBS_PER_SCAN) break;
      if (idleCharacters.length === 0) break;

      for (let y = 0; y < level.height; y++) {
        if (jobsAssigned >= MAX_JOBS_PER_SCAN) break;
        if (idleCharacters.length === 0) break;

        for (let x = 0; x < level.width; x++) {
          if (jobsAssigned >= MAX_JOBS_PER_SCAN) break;
          if (idleCharacters.length === 0) break;

          const tile = level.tiles[y * level.width + x];
          if (!tile.crop || tile.crop.stage !== "mature") continue;

          const pos: Position3D = { x, y, z: zLevel };

          // Skip reserved tiles
          if (this.jobProcessor.reservations.isReserved(pos)) continue;

          // Pick closest idle colonist
          const charId = this.pickClosestCharacter(idleCharacters, pos);
          if (!charId) continue;

          const job = createHarvestJob(charId, pos, tile.crop.type);
          this.jobProcessor.assignJob(job);
          jobsAssigned++;

          // Remove from idle pool
          const idx = idleCharacters.indexOf(charId);
          if (idx !== -1) idleCharacters.splice(idx, 1);
        }
      }
    }
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
