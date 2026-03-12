// =============================================================================
// JOB SYSTEM TYPES
// =============================================================================

import type {
  CropType,
  FloorType,
  ItemType,
  Position3D,
  StructureType,
  TerrainType,
} from "../../world/types";
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
  /** Change terrain to this type */
  newTerrain?: TerrainType;
  status: StepStatus;
}

export interface SpawnItemsStep {
  type: "spawn_items";
  position: Position3D;
  items: Array<{ type: ItemType; quantity: number }>;
  /** When set, item quality is calculated from the character's skill level */
  skillId?: string;
  status: StepStatus;
}

export interface RestoreNeedStep {
  type: "restore_need";
  /** Which need to restore (e.g. "hunger") */
  needId: string;
  /** Amount to add (clamped to 0-1) */
  amount: number;
  status: StepStatus;
}

export interface PickupItemStep {
  type: "pickup_item";
  /** Tile to pick up from */
  position: Position3D;
  /** ID of the specific item to pick up */
  itemId: string;
  status: StepStatus;
}

export interface DropItemStep {
  type: "drop_item";
  /** Tile to drop item onto */
  position: Position3D;
  status: StepStatus;
}

export interface PlantCropStep {
  type: "plant_crop";
  /** Tile to plant on */
  position: Position3D;
  /** Which crop to plant */
  cropType: CropType;
  status: StepStatus;
}

export interface HarvestCropStep {
  type: "harvest_crop";
  /** Tile to harvest from */
  position: Position3D;
  /** Which crop is being harvested (for yield lookup) */
  cropType: CropType;
  status: StepStatus;
}

export interface ConsumeItemStep {
  type: "consume_item";
  /** Which need to restore (e.g. "hunger") */
  needId: string;
  status: StepStatus;
}

export interface PlaceStructureStep {
  type: "place_structure";
  /** Tile to place the structure on */
  position: Position3D;
  /** Structure type to build */
  structureType: StructureType;
  status: StepStatus;
}

export interface PlaceFloorStep {
  type: "place_floor";
  /** Tile to place the floor on */
  position: Position3D;
  /** Floor type to build */
  floorType: FloorType;
  status: StepStatus;
}

export interface RepairStructureStep {
  type: "repair_structure";
  /** Tile containing the structure to repair */
  position: Position3D;
  status: StepStatus;
}

export interface CleanTileStep {
  type: "clean_tile";
  /** Tile to clean */
  position: Position3D;
  status: StepStatus;
}

export type JobStep =
  | MoveStep
  | WorkStep
  | TransformTileStep
  | SpawnItemsStep
  | RestoreNeedStep
  | PickupItemStep
  | DropItemStep
  | PlantCropStep
  | HarvestCropStep
  | ConsumeItemStep
  | PlaceStructureStep
  | PlaceFloorStep
  | RepairStructureStep
  | CleanTileStep;

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
  createJob: (characterId: EntityId, target: Position3D, tile: Tile) => Job;
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
