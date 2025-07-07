// =============================================================================
// ACTION RESOLVER - Determines available actions for a tile
// =============================================================================

import type { Position3D, World } from "../../world/types";
import { getWorldTileAt } from "../../world/utils/tile-utils";
import { ACTION_RULES } from "./action-rules";
import type { Action } from "./types";

/**
 * Given a tile position, returns available actions sorted by priority (highest first).
 * Inspects tile structure, terrain, and items to match against declarative rules.
 */
export function resolveActions(position: Position3D, world: World): Action[] {
  const tile = getWorldTileAt(world, position.x, position.y, position.z);
  if (!tile) return [];

  const actions: Action[] = [];

  for (const rule of ACTION_RULES) {
    if (rule.matches(tile, position)) {
      actions.push({
        id: rule.id,
        label: rule.label,
        priority: rule.priority,
        createJob: rule.createJob,
      });
    }
  }

  // Sort by priority descending (highest priority first)
  actions.sort((a, b) => b.priority - a.priority);

  return actions;
}
