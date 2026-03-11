// =============================================================================
// SLEEP BEHAVIOR SYSTEM
// =============================================================================
// When a colonist's energy drops below a threshold, autonomously sleep
// on the ground to restore energy.

import type { EntityStore } from "../entity-store";
import type { JobProcessor } from "../jobs";
import { createSleepJob } from "../jobs/job-factory";

// =============================================================================
// CONSTANTS
// =============================================================================

/** Energy level at which colonists will sleep */
const ENERGY_THRESHOLD = 0.3;

// =============================================================================
// SLEEP BEHAVIOR SYSTEM
// =============================================================================

export class SleepBehavior {
  constructor(
    private entityStore: EntityStore,
    private jobProcessor: JobProcessor,
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

      // Only sleep when tired
      if (character.needs.energy >= ENERGY_THRESHOLD) continue;

      // Sleep in place — no movement needed
      const job = createSleepJob(character.id, character.position);
      this.jobProcessor.assignJob(job);
    }
  }
}
