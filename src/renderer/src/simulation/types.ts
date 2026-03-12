// =============================================================================
// SIMULATION TYPES
// =============================================================================

import type { Position2D, Position3D } from "../world/types";
import type { Schedule } from "./schedule";
import { createDefaultSchedule } from "./schedule";
import type { CharacterSkills } from "./skills";
import { createDefaultSkills } from "./skills";
import type { ActiveThought } from "./thoughts";
import type { CharacterTraits } from "./traits";
import type { WorkPriorities } from "./work-priorities";
import { createDefaultWorkPriorities } from "./work-priorities";

// =============================================================================
// ENTITY TYPES
// =============================================================================

/** Unique identifier for entities */
export type EntityId = string;

/** Base entity interface with position */
export interface Entity {
  id: EntityId;
  position: Position3D;
  /** Sub-tile offset for smooth visual movement (0-1 range) */
  visualOffset: Position2D;
}

/** Character types */
export type CharacterType = "colonist" | "creature" | "visitor";

/** Character gender */
export type Gender = "male" | "female";

/** Character biographical identity */
export interface CharacterBiography {
  /** Character's first name */
  firstName: string;
  /** Optional nickname (displayed in quotes) */
  nickname: string | null;
  /** Character's last name */
  lastName: string;
  /** Character's age in years */
  age: number;
  /** Character's gender */
  gender: Gender;
}

/** Character movement state */
export interface CharacterMovement {
  /** Movement speed in tiles per second */
  speed: number;
  /** Current path being followed (null = stationary) */
  path: Position3D[] | null;
  /** Current index in the path array */
  pathIndex: number;
  /** Progress from current tile to next tile (0-1) */
  progress: number;
  /** Whether currently moving */
  isMoving: boolean;
}

/** Character control mode */
export type ControlMode = "idle" | "imperative" | "scheduled" | "drafted";

/** Character control state */
export interface CharacterControl {
  /** Current control mode */
  mode: ControlMode;
  /** Currently executing command */
  currentCommand: Command | null;
  /** Queue of scheduled commands */
  commandQueue: Command[];
}

/** Character needs (for future AI) */
export interface CharacterNeeds {
  /** Hunger level (0-1, 1 = full) */
  hunger: number;
  /** Energy level (0-1, 1 = rested) */
  energy: number;
  /** Mood level (0-1, 1 = happy) */
  mood: number;
  /** Comfort level (0-1, 1 = comfortable) */
  comfort: number;
  /** Recreation level (0-1, 1 = entertained) */
  recreation: number;
  /** Social level (0-1, 1 = socially fulfilled) */
  social: number;
}

/** Mental break types */
export type MentalBreakType = "sad_wander" | "food_binge" | "daze";

/** Active mental break state */
export interface MentalBreakState {
  type: MentalBreakType;
  startedAtTick: number;
}

/** Character entity */
export interface Character extends Entity {
  type: CharacterType;
  name: string;
  /** Biographical identity (age, gender, name components) */
  biography: CharacterBiography;
  /** Visual color for rendering */
  color: number;
  movement: CharacterMovement;
  control: CharacterControl;
  needs: CharacterNeeds;
  /** Skill levels and experience */
  skills: CharacterSkills;
  /** Personality traits */
  traits: CharacterTraits;
  /** Active mood thoughts */
  thoughts: ActiveThought[];
  /** Opinion scores for other colonists (EntityId → opinion, -100 to +100) */
  relationships: Record<EntityId, number>;
  /** Romantic partner, or null if single */
  partner: EntityId | null;
  /** Married spouse, or null if unmarried */
  spouse: EntityId | null;
  /** Active mental break, or null if not in a break */
  mentalBreak: MentalBreakState | null;
  /** Per-work-type priority (0 = disabled, 1 = highest, 4 = lowest) */
  workPriorities: WorkPriorities;
  /** 24-hour activity schedule */
  schedule: Schedule;
}

// =============================================================================
// COMMAND TYPES
// =============================================================================

/** Available command types */
export type CommandType =
  | "move"
  | "haul"
  | "build"
  | "mine"
  | "harvest"
  | "idle";

/** Command status */
export type CommandStatus =
  | "pending"
  | "active"
  | "completed"
  | "failed"
  | "cancelled";

/** Base command interface */
export interface CommandBase {
  id: string;
  type: CommandType;
  /** Higher priority = more urgent */
  priority: number;
  /** Entity this command is assigned to */
  assignedTo: EntityId | null;
  status: CommandStatus;
  /** Timestamp when command was created */
  createdAt: number;
}

/** Move to a destination */
export interface MoveCommand extends CommandBase {
  type: "move";
  destination: Position3D;
  /** Computed path (filled by pathfinding) */
  path?: Position3D[];
}

/** Haul an item to a destination (for future use) */
export interface HaulCommand extends CommandBase {
  type: "haul";
  itemId: EntityId;
  pickupLocation: Position3D;
  destination: Position3D;
}

/** Build a structure (for future use) */
export interface BuildCommand extends CommandBase {
  type: "build";
  structureType: string;
  position: Position3D;
}

/** Mine a tile (for future use) */
export interface MineCommand extends CommandBase {
  type: "mine";
  position: Position3D;
}

/** Harvest a resource (for future use) */
export interface HarvestCommand extends CommandBase {
  type: "harvest";
  position: Position3D;
}

/** Idle command (do nothing) */
export interface IdleCommand extends CommandBase {
  type: "idle";
  /** Duration in ticks (-1 = indefinite) */
  duration: number;
}

/** Union of all command types */
export type Command =
  | MoveCommand
  | HaulCommand
  | BuildCommand
  | MineCommand
  | HarvestCommand
  | IdleCommand;

// =============================================================================
// SIMULATION STATE TYPES
// =============================================================================

/** Simulation speed multiplier */
export type SimulationSpeed = 1 | 2 | 4;

/** Simulation state */
export interface SimulationState {
  /** Whether simulation is running */
  isPlaying: boolean;
  /** Speed multiplier */
  speed: SimulationSpeed;
  /** Current simulation tick */
  currentTick: number;
  /** Characters indexed by ID */
  characters: Map<EntityId, Character>;
  /** Spatial index: "x,y,z" -> Set of entity IDs */
  charactersByTile: Map<string, Set<EntityId>>;
}

/** Simulation actions */
export interface SimulationActions {
  // Time control
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  setSpeed: (speed: SimulationSpeed) => void;
  tick: (deltaTime: number) => void;

  // Entity management
  addCharacter: (character: Character) => void;
  removeCharacter: (id: EntityId) => void;
  updateCharacter: (id: EntityId, changes: Partial<Character>) => void;
  getCharacter: (id: EntityId) => Character | undefined;
  getCharactersAtTile: (position: Position3D) => Character[];

  // Commands
  issueCommand: (characterId: EntityId, command: Command) => void;
  cancelCommand: (characterId: EntityId) => void;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/** Generate a unique entity ID */
export function generateEntityId(prefix: string = "entity"): EntityId {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/** Generate a unique command ID */
export function generateCommandId(): string {
  return `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/** Convert Position3D to spatial index key */
export function positionToKey(position: Position3D): string {
  return `${position.x},${position.y},${position.z}`;
}

/** Parse spatial index key to Position3D */
export function keyToPosition(key: string): Position3D {
  const [x, y, z] = key.split(",").map(Number);
  return { x, y, z };
}

/** Create a default character */
export function createCharacter(
  options: Partial<Character> & { name: string; position: Position3D },
): Character {
  return {
    id: generateEntityId("char"),
    type: "colonist",
    biography: {
      firstName: options.name,
      nickname: null,
      lastName: "",
      age: 25,
      gender: "male",
    },
    color: 0x4a90d9,
    visualOffset: { x: 0, y: 0 },
    movement: {
      speed: 2, // 2 tiles per second
      path: null,
      pathIndex: 0,
      progress: 0,
      isMoving: false,
    },
    control: {
      mode: "idle",
      currentCommand: null,
      commandQueue: [],
    },
    needs: {
      hunger: 1,
      energy: 1,
      mood: 1,
      comfort: 1,
      recreation: 1,
      social: 1,
    },
    skills: createDefaultSkills(),
    traits: [],
    thoughts: [],
    relationships: {},
    partner: null,
    spouse: null,
    mentalBreak: null,
    workPriorities: createDefaultWorkPriorities(),
    schedule: createDefaultSchedule(),
    ...options,
  };
}

/** Create a move command */
export function createMoveCommand(
  destination: Position3D,
  options?: Partial<MoveCommand>,
): MoveCommand {
  return {
    id: generateCommandId(),
    type: "move",
    priority: 5,
    assignedTo: null,
    status: "pending",
    createdAt: Date.now(),
    destination,
    ...options,
  };
}
