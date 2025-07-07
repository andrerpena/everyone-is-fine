// =============================================================================
// SIMULATION MODULE EXPORTS
// =============================================================================

// Entity Store
export { EntityStore, entityStore } from "./entity-store";
// Jobs
export {
  ACTION_RULES,
  createChopJob,
  createMineJob,
  createMoveJob,
  generateJobId,
  type Job,
  JobProcessor,
  type JobProgressInfo,
  JobQueue,
  type JobStatus,
  type JobStep,
  jobQueue,
  resolveActions,
} from "./jobs";
// Movement
export {
  type Direction,
  directionToAngle,
  easeIn,
  easeInOut,
  easeOut,
  getCharacterCenterPosition,
  getCharacterDirection,
  getCharacterVisualPosition,
  getMovementDirection,
  lerp,
  lerpPosition2D,
  lerpPosition3D,
  MovementSystem,
  smootherStep,
  smoothStep,
} from "./movement";
// Pathfinding
export {
  ALL_DIRECTIONS,
  type AStarNode,
  AStarPathfinder,
  CARDINAL_DIRECTIONS,
  chebyshevDistance,
  DIAGONAL_DIRECTIONS,
  euclideanDistance,
  findPath,
  getMovementCost,
  manhattanDistance,
  octileDistance,
  type Path,
  PathCache,
  type PathfinderOptions,
  type PathResult,
  positionKey,
  positionsEqual,
} from "./pathfinding";
// Simulation Loop
export {
  MS_PER_TICK,
  SimulationLoop,
  simulationLoop,
  TICKS_PER_SECOND,
} from "./simulation-loop";

// Types
export {
  type BuildCommand,
  type Character,
  type CharacterControl,
  type CharacterMovement,
  type CharacterNeeds,
  type CharacterType,
  type Command,
  type CommandBase,
  type CommandStatus,
  type CommandType,
  type ControlMode,
  createCharacter,
  createMoveCommand,
  type Entity,
  type EntityId,
  generateCommandId,
  generateEntityId,
  type HarvestCommand,
  type HaulCommand,
  type IdleCommand,
  keyToPosition,
  type MineCommand,
  type MoveCommand,
  positionToKey,
  type SimulationActions,
  type SimulationSpeed,
  type SimulationState,
} from "./types";
