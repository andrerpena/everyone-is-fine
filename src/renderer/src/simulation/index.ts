// =============================================================================
// SIMULATION MODULE EXPORTS
// =============================================================================

// Behaviors
export { IdleBehaviorSystem } from "./behaviors/idle-behavior";
export {
  MENTAL_BREAK_RECOVERY_THRESHOLD,
  MENTAL_BREAK_TRIGGER_THRESHOLD,
  MentalBreakSystem,
} from "./behaviors/mental-break-system";
export { NeedSatisfactionSystem } from "./behaviors/need-satisfaction-system";
// Entity Store
export { EntityStore, entityStore } from "./entity-store";
export {
  ALL_EVENTS,
  type EventContext,
  type EventDefinition,
  WANDERER_CHANCE,
  WANDERER_MAX_COLONY_SIZE,
} from "./events/event-definitions";
// Events
export { EventSystem } from "./events/event-system";
// Filth
export { FilthSystem } from "./filth-system";
// Game Notifications
export { GameNotifications } from "./game-notifications";
// Items
export { ItemDeteriorationSystem } from "./items/item-deterioration-system";
// Jobs
export {
  ACTION_RULES,
  ConstructionSystem,
  CookingSystem,
  createChopJob,
  createHaulJob,
  createMineJob,
  createMoveJob,
  generateJobId,
  HarvestingSystem,
  HaulingSystem,
  type Job,
  JobProcessor,
  type JobProgressInfo,
  JobQueue,
  type JobStatus,
  type JobStep,
  jobQueue,
  ReservationSystem,
  resolveActions,
  SowingSystem,
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
// Needs
export {
  getNeedThreshold,
  NEED_CONFIGS,
  type NeedConfig,
  type NeedId,
  NeedsSystem,
  type NeedThreshold,
} from "./needs";
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
// Plants
export { CROP_REGISTRY } from "./plants/crop-registry";
export { PlantGrowthSystem } from "./plants/plant-growth-system";
// Relationships
export {
  adjustOpinion,
  BREAKUP_OPINION_THRESHOLD,
  canFormRomance,
  getOpinion,
  getRelationshipLabel,
  OPINION_MAX,
  OPINION_MIN,
  type RelationshipLabel,
  ROMANCE_OPINION_THRESHOLD,
  SOCIALIZE_OPINION_GAIN,
  shouldBreakUp,
} from "./relationships";
// Rooms
export { type Room, RoomDetectionSystem, type RoomStats } from "./rooms";
// Simulation Loop
export {
  MS_PER_TICK,
  SimulationLoop,
  simulationLoop,
  TICKS_PER_SECOND,
} from "./simulation-loop";
// Skills
export {
  ALL_SKILL_IDS,
  BASE_WORK_XP,
  type CharacterSkills,
  createDefaultSkills,
  type ExperienceResult,
  formatSkillsSummary,
  generateRandomSkills,
  getSkillProgress,
  getWorkSpeedMultiplier,
  grantExperience,
  JOB_SKILL_MAP,
  MAX_SKILL_LEVEL,
  PASSION_XP_MULTIPLIERS,
  type Passion,
  SKILL_DEFINITIONS,
  type SkillData,
  type SkillDefinition,
  type SkillId,
  xpForNextLevel,
} from "./skills";
// Social Interactions
export { SocialInteractionSystem } from "./social-interaction-system";
// Thoughts
export {
  type ActiveThought,
  computeMoodFromThoughts,
  evaluateConditionThoughts,
  getThoughtDefinition,
  MoodThoughtSystem,
  THOUGHT_DEFINITIONS,
  THOUGHT_MAP,
  type ThoughtDefinition,
  type ThoughtId,
} from "./thoughts";
// Time
export {
  advanceTime,
  DAYS_PER_SEASON,
  formatGameTime,
  getDayPeriod,
  getOutdoorTemperature,
} from "./time";
// Traits
export {
  ALL_TRAIT_IDS,
  type CharacterTraits,
  formatTraitsSummary,
  generateRandomTraits,
  getTraitDefinition,
  hasConflict,
  TRAIT_DEFINITIONS,
  type TraitCategory,
  type TraitDefinition,
  type TraitId,
} from "./traits";
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
// Vision
export { VisionSystem } from "./vision/vision-system";
// Weather
export { SnowAccumulationSystem } from "./weather/snow-accumulation-system";
export {
  WEATHER_LABELS,
  WEATHER_TEMP_MODIFIERS,
  WeatherSystem,
} from "./weather/weather-system";
