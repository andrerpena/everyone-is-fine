import type { Selection } from "./types";

/**
 * Extract selected colonist IDs from any selection state.
 * Works with both single-entity and multi-entity selection.
 *
 * @param selection - The current selection state
 * @returns Array of selected colonist IDs (empty if no colonists selected)
 */
export function getSelectedColonistIds(selection: Selection): string[] {
  if (selection.type === "entity" && selection.entityType === "colonist") {
    return [selection.entityId];
  }
  if (
    selection.type === "multi-entity" &&
    selection.entityType === "colonist"
  ) {
    return Array.from(selection.entityIds);
  }
  return [];
}
