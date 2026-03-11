// =============================================================================
// GAME NOTIFICATIONS
// =============================================================================
// Tracks entity state transitions and fires toast notifications for key events.
// Runs periodically (not every tick) to avoid spam.

import { showToast } from "../components/floating/toast/toastUtils";
import type { EntityStore } from "./entity-store";
import { getNeedThreshold, type NeedThreshold } from "./needs/needs-config";
import type { EntityId, MentalBreakType } from "./types";

// =============================================================================
// CONSTANTS
// =============================================================================

/** Check for notification-worthy events every N ticks */
const CHECK_INTERVAL_TICKS = 60;

/** Mental break type display labels */
const MENTAL_BREAK_LABELS: Record<MentalBreakType, string> = {
  sad_wander: "Sad Wander",
  food_binge: "Food Binge",
  daze: "Daze",
};

// =============================================================================
// GAME NOTIFICATIONS CLASS
// =============================================================================

export class GameNotifications {
  private entityStore: EntityStore;

  /** Previous mental break state per character */
  private prevMentalBreak: Map<EntityId, MentalBreakType | null> = new Map();

  /** Previous hunger threshold per character */
  private prevHungerThreshold: Map<EntityId, NeedThreshold> = new Map();

  /** Tick counter for throttling */
  private tickCounter = 0;

  constructor(entityStore: EntityStore) {
    this.entityStore = entityStore;
  }

  update(): void {
    this.tickCounter++;
    if (this.tickCounter < CHECK_INTERVAL_TICKS) return;
    this.tickCounter = 0;

    for (const character of this.entityStore.values()) {
      const name = character.name;
      const id = character.id;

      // --- Mental break transitions ---
      const currentBreak = character.mentalBreak?.type ?? null;
      const prevBreak = this.prevMentalBreak.get(id) ?? null;

      if (currentBreak !== prevBreak) {
        if (currentBreak !== null && prevBreak === null) {
          const label = MENTAL_BREAK_LABELS[currentBreak];
          showToast(`${name} is having a mental break: ${label}!`, "error", {
            duration: 5000,
          });
        } else if (currentBreak === null && prevBreak !== null) {
          showToast(
            `${name} has recovered from their mental break.`,
            "default",
            {
              duration: 3000,
            },
          );
        }
        this.prevMentalBreak.set(id, currentBreak);
      }

      // --- Hunger critical transition ---
      const currentHunger = getNeedThreshold(character.needs.hunger);
      const prevHunger = this.prevHungerThreshold.get(id) ?? "satisfied";

      if (currentHunger !== prevHunger) {
        if (currentHunger === "critical" && prevHunger !== "critical") {
          showToast(`${name} is starving!`, "error", { duration: 5000 });
        }
        this.prevHungerThreshold.set(id, currentHunger);
      }
    }
  }
}
