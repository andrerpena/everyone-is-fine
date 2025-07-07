// =============================================================================
// JOB FACTORY - Creates concrete job instances
// =============================================================================

import type { Position3D } from "../../world/types";
import type { EntityId } from "../types";
import { generateJobId, type Job } from "./types";

/**
 * Create a "chop tree" job.
 * Steps: move adjacent → work 300 ticks (~5s at 60 TPS) → remove structure → spawn wood
 */
export function createChopJob(characterId: EntityId, target: Position3D): Job {
  return {
    id: generateJobId(),
    type: "chop",
    characterId,
    targetPosition: target,
    currentStepIndex: 0,
    status: "pending",
    createdAt: Date.now(),
    steps: [
      { type: "move", destination: target, adjacent: true, status: "pending" },
      {
        type: "work",
        totalTicks: 300,
        ticksWorked: 0,
        status: "pending",
      },
      {
        type: "transform_tile",
        position: target,
        removeStructure: true,
        status: "pending",
      },
      {
        type: "spawn_items",
        position: target,
        items: [{ type: "wood", quantity: 25 }],
        status: "pending",
      },
    ],
  };
}

/**
 * Create a "mine boulder" job.
 * Steps: move adjacent → work 480 ticks (~8s at 60 TPS) → remove structure → spawn stone
 */
export function createMineJob(characterId: EntityId, target: Position3D): Job {
  return {
    id: generateJobId(),
    type: "mine",
    characterId,
    targetPosition: target,
    currentStepIndex: 0,
    status: "pending",
    createdAt: Date.now(),
    steps: [
      { type: "move", destination: target, adjacent: true, status: "pending" },
      {
        type: "work",
        totalTicks: 480,
        ticksWorked: 0,
        status: "pending",
      },
      {
        type: "transform_tile",
        position: target,
        removeStructure: true,
        status: "pending",
      },
      {
        type: "spawn_items",
        position: target,
        items: [{ type: "stone", quantity: 20 }],
        status: "pending",
      },
    ],
  };
}

/**
 * Create a simple "move" job.
 * Steps: move to destination
 */
export function createMoveJob(characterId: EntityId, target: Position3D): Job {
  return {
    id: generateJobId(),
    type: "move",
    characterId,
    targetPosition: target,
    currentStepIndex: 0,
    status: "pending",
    createdAt: Date.now(),
    steps: [
      {
        type: "move",
        destination: target,
        adjacent: false,
        status: "pending",
      },
    ],
  };
}
