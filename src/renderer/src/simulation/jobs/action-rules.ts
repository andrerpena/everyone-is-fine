// =============================================================================
// ACTION RULES - Declarative tile → action mappings
// =============================================================================
// To add a new action, append a rule to ACTION_RULES. No other code changes needed.

import { STRUCTURE_REGISTRY } from "../../world/registries/structure-registry";
import { TERRAIN_REGISTRY } from "../../world/registries/terrain-registry";
import {
  createBuildJob,
  createChopJob,
  createDeconstructJob,
  createForageJob,
  createMineJob,
  createMineTerrainJob,
  createMoveJob,
  createRepairJob,
  createSmoothJob,
  isSmoothable,
} from "./job-factory";
import type { ActionRule } from "./types";

export const ACTION_RULES: ActionRule[] = [
  {
    id: "build",
    label: "Build",
    priority: 15,
    matches: (tile) => tile.blueprint !== null && tile.structure === null,
    createJob: (characterId, target, tile) =>
      createBuildJob(characterId, target, tile.blueprint!.type),
  },
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
    id: "forage",
    label: "Forage",
    priority: 10,
    matches: (tile) =>
      tile.structure?.type === "bush" ||
      tile.structure?.type === "bush_berry" ||
      tile.structure?.type === "bush_healroot",
    createJob: (characterId, target, tile) => {
      if (tile.structure?.type === "bush_berry") {
        return createForageJob(characterId, target, {
          type: "berries",
          quantity: 3,
        });
      }
      if (tile.structure?.type === "bush_healroot") {
        return createForageJob(characterId, target, {
          type: "medicine_herbal",
          quantity: 1,
        });
      }
      return createForageJob(characterId, target);
    },
  },
  {
    id: "mine",
    label: "Mine",
    priority: 10,
    matches: (tile) => tile.structure?.type === "boulder",
    createJob: (characterId, target) => createMineJob(characterId, target),
  },
  {
    id: "mine_terrain",
    label: "Mine",
    priority: 8,
    matches: (tile) => {
      const props = TERRAIN_REGISTRY[tile.terrain.type];
      return (
        props.isDiggable && props.hardness >= 0.7 && tile.structure === null
      );
    },
    createJob: (characterId, target, tile) =>
      createMineTerrainJob(characterId, target, tile.terrain.type),
  },
  {
    id: "smooth",
    label: "Smooth",
    priority: 7,
    matches: (tile) =>
      isSmoothable(tile.terrain.type) &&
      tile.floor === null &&
      tile.structure === null,
    createJob: (characterId, target, tile) =>
      createSmoothJob(characterId, target, tile.terrain.type),
  },
  {
    id: "repair",
    label: "Repair",
    priority: 6,
    matches: (tile) => {
      if (!tile.structure) return false;
      const props = STRUCTURE_REGISTRY[tile.structure.type];
      return (
        props.category !== "natural" &&
        tile.structure.type !== "none" &&
        tile.structure.health < props.maxHealth
      );
    },
    createJob: (characterId, target, tile) =>
      createRepairJob(
        characterId,
        target,
        tile.structure!.type,
        tile.structure!.health,
      ),
  },
  {
    id: "deconstruct",
    label: "Deconstruct",
    priority: 5,
    matches: (tile) => {
      if (!tile.structure) return false;
      const props = STRUCTURE_REGISTRY[tile.structure.type];
      return props.category !== "natural" && tile.structure.type !== "none";
    },
    createJob: (characterId, target, tile) =>
      createDeconstructJob(characterId, target, tile.structure!.type),
  },
  {
    id: "move",
    label: "Move",
    priority: 1,
    matches: (tile) => tile.pathfinding.isPassable,
    createJob: (characterId, target) => createMoveJob(characterId, target),
  },
];
