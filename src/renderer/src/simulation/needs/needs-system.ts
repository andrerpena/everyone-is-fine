// =============================================================================
// NEEDS SYSTEM
// =============================================================================
// Decays colonist needs each tick based on configured rates

import type { EntityStore } from "../entity-store";
import type { CharacterNeeds } from "../types";
import { NEED_CONFIGS } from "./needs-config";

// =============================================================================
// NEEDS SYSTEM CLASS
// =============================================================================

/**
 * Processes need decay for all characters each tick.
 * Subtracts configured decay rates from each need and clamps to [0, 1].
 */
export class NeedsSystem {
  private entityStore: EntityStore;

  constructor(entityStore: EntityStore) {
    this.entityStore = entityStore;
  }

  /**
   * Update all character needs for one tick.
   * @param deltaTime - Time since last tick in seconds
   */
  update(deltaTime: number): void {
    for (const character of this.entityStore.values()) {
      const needs = { ...character.needs };
      let changed = false;

      for (const config of NEED_CONFIGS) {
        const current = needs[config.id];
        if (current <= 0) continue;

        const decayed = Math.max(
          0,
          current - config.decayPerSecond * deltaTime,
        );
        if (decayed !== current) {
          needs[config.id] = decayed;
          changed = true;
        }
      }

      if (changed) {
        this.entityStore.update(character.id, {
          needs: needs as CharacterNeeds,
        });
      }
    }
  }
}
