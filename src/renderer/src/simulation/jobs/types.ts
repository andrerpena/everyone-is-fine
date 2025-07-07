// =============================================================================
// JOB SYSTEM TYPES
// =============================================================================

import type { ItemType, Position3D } from "../../world/types";
import type { EntityId } from "../types";

// =============================================================================
// ACTIONS - What a character can do at a tile
// =============================================================================

/** An available action resolved from tile state */
export interface Action {
  /** Unique action identifier, e.g. "chop", "mine", "move" */
  id: string;
  /** Display label, e.g. "Chop Tree" */
  label: string;
  /** Higher priority = shown first / default action */
  priority: number;
  /** Create a job instance for this action */
  createJob: (characterId: EntityId, target: Position3D) => Job;
}

// =============================================================================
// JOBS - Multi-step tasks assigned to characters
// =============================================================================

export type JobStatus =
  | "pending"
  | "active"
  | "completed"
  | "failed"
  | "cancelled";

/** A multi-step task assigned to a character */
export interface Job {
  id: string;
  /** Job type identifier, e.g. "chop", "mine", "move" */
  type: string;
  characterId: EntityId;
  targetPosition: Position3D;
  steps: JobStep[];
  currentStepIndex: number;
  status: JobStatus;
  createdAt: number;
}

// =============================================================================
// STEPS - Individual units of work within a job
// =============================================================================

export type StepStatus = "pending" | "active" | "completed" | "failed";

export interface MoveStep {
  type: "move";
  /** Where to move */
  destination: Position3D;
  /** If true, move to an adjacent passable tile instead of onto the destination */
  adjacent: boolean;
  status: StepStatus;
}

export interface WorkStep {
  type: "work";
  /** Total ticks required to complete */
  totalTicks: number;
  /** Ticks completed so far */
  ticksWorked: number;
  status: StepStatus;
}

export interface TransformTileStep {
  type: "transform_tile";
  position: Position3D;
  /** Remove the structure from the tile */
  removeStructure?: boolean;
  status: StepStatus;
}

export interface SpawnItemsStep {
  type: "spawn_items";
  position: Position3D;
  items: Array<{ type: ItemType; quantity: number }>;
  status: StepStatus;
}

export type JobStep = MoveStep | WorkStep | TransformTileStep | SpawnItemsStep;

// =============================================================================
// ACTION RULES - Declarative matching for tile → actions
// =============================================================================

import type { Tile } from "../../world/types";

/** A rule that maps tile state to an available action */
export interface ActionRule {
  id: string;
  label: string;
  priority: number;
  /** Return true if this action applies to the given tile */
  matches: (tile: Tile, position: Position3D) => boolean;
  /** Create a job for this action */
  createJob: (characterId: EntityId, target: Position3D) => Job;
}

// =============================================================================
// JOB PROGRESS - Lightweight snapshot for rendering
// =============================================================================

/** Snapshot of an active job's progress, consumed by renderers */
export interface JobProgressInfo {
  characterId: EntityId;
  jobType: string;
  targetPosition: Position3D;
  /** 0-1 progress fraction, or null if not currently in a work step */
  progress: number | null;
}

// =============================================================================
// HELPERS
// =============================================================================

let jobCounter = 0;

export function generateJobId(): string {
  return `job_${Date.now()}_${++jobCounter}`;
}
