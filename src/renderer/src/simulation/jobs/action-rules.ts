// =============================================================================
// ACTION RULES - Declarative tile → action mappings
// =============================================================================
// To add a new action, append a rule to ACTION_RULES. No other code changes needed.

import { createChopJob, createMineJob, createMoveJob } from "./job-factory";
import type { ActionRule } from "./types";

export const ACTION_RULES: ActionRule[] = [
  {
    id: "chop",
    label: "Chop",
    priority: 10,
    matches: (tile) =>
      tile.structure?.type === "tree_oak" ||
      tile.structure?.type === "tree_pine",
    createJob: (characterId, target) => createChopJob(characterId, target),
  },
  {
    id: "mine",
    label: "Mine",
    priority: 10,
    matches: (tile) => tile.structure?.type === "boulder",
    createJob: (characterId, target) => createMineJob(characterId, target),
  },
  {
    id: "move",
    label: "Move",
    priority: 1,
    matches: (tile) => tile.pathfinding.isPassable,
    createJob: (characterId, target) => createMoveJob(characterId, target),
  },
];
