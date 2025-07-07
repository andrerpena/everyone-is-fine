// =============================================================================
// SIMULATION TYPES
// =============================================================================

import type { Position2D, Position3D } from "../world/types";

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
export type ControlMode = "idle" | "imperative" | "scheduled";

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
}

/** Character entity */
export interface Character extends Entity {
  type: CharacterType;
  name: string;
  /** Visual color for rendering */
  color: number;
  movement: CharacterMovement;
  control: CharacterControl;
  needs: CharacterNeeds;
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
    },
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
