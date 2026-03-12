// =============================================================================
// ALERT DEFINITIONS
// =============================================================================
// Pure functions that evaluate colony state and return active alerts.
// Each alert condition is a simple predicate over the character array.

import { getNeedThreshold } from "../simulation/needs/needs-config";
import type { Character } from "../simulation/types";

// =============================================================================
// TYPES
// =============================================================================

export type AlertSeverity = "info" | "warning" | "critical";

export interface AlertDefinition {
  /** Unique identifier */
  readonly id: string;
  /** Display label */
  readonly label: string;
  /** Severity level (affects display color) */
  readonly severity: AlertSeverity;
  /** Evaluate whether this alert is active. Returns detail text or null if inactive. */
  readonly check: (characters: Character[]) => string | null;
}

// =============================================================================
// ALERT DEFINITIONS
// =============================================================================

export const ALERT_DEFINITIONS: readonly AlertDefinition[] = [
  {
    id: "colonist_starving",
    label: "Colonist Starving",
    severity: "critical",
    check: (characters) => {
      const starving = characters.filter(
        (c) => getNeedThreshold(c.needs.hunger) === "critical",
      );
      if (starving.length === 0) return null;
      return starving.map((c) => c.name).join(", ");
    },
  },
  {
    id: "colonist_exhausted",
    label: "Colonist Exhausted",
    severity: "warning",
    check: (characters) => {
      const exhausted = characters.filter(
        (c) => getNeedThreshold(c.needs.energy) === "critical",
      );
      if (exhausted.length === 0) return null;
      return exhausted.map((c) => c.name).join(", ");
    },
  },
  {
    id: "mental_break_active",
    label: "Mental Break",
    severity: "critical",
    check: (characters) => {
      const breaking = characters.filter((c) => c.mentalBreak !== null);
      if (breaking.length === 0) return null;
      return breaking.map((c) => c.name).join(", ");
    },
  },
  {
    id: "colonist_very_unhappy",
    label: "Colonist Very Unhappy",
    severity: "warning",
    check: (characters) => {
      const unhappy = characters.filter(
        (c) =>
          getNeedThreshold(c.needs.mood) === "critical" &&
          c.mentalBreak === null,
      );
      if (unhappy.length === 0) return null;
      return unhappy.map((c) => c.name).join(", ");
    },
  },
  {
    id: "all_colonists_idle",
    label: "All Colonists Idle",
    severity: "info",
    check: (characters) => {
      if (characters.length === 0) return null;
      const nonDrafted = characters.filter((c) => c.control.mode !== "drafted");
      if (nonDrafted.length === 0) return null;
      const allIdle = nonDrafted.every(
        (c) =>
          !c.movement.isMoving &&
          c.mentalBreak === null &&
          c.control.mode === "idle",
      );
      return allIdle ? `${nonDrafted.length} colonists` : null;
    },
  },
];

// =============================================================================
// EVALUATION
// =============================================================================

export interface ActiveAlert {
  readonly id: string;
  readonly label: string;
  readonly severity: AlertSeverity;
  /** Detail text (e.g., colonist names) */
  readonly detail: string;
}

/** Evaluate all alert definitions against current characters and return active alerts */
export function evaluateAlerts(characters: Character[]): ActiveAlert[] {
  const alerts: ActiveAlert[] = [];
  for (const def of ALERT_DEFINITIONS) {
    const detail = def.check(characters);
    if (detail !== null) {
      alerts.push({
        id: def.id,
        label: def.label,
        severity: def.severity,
        detail,
      });
    }
  }
  return alerts;
}
