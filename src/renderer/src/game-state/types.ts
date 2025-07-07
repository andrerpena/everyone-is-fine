// =============================================================================
// GAME STATE TYPES
// =============================================================================

import type { Job, JobProgressInfo } from "../simulation/jobs/types";
import type {
  Character,
  Command,
  EntityId,
  SimulationSpeed,
} from "../simulation/types";
import type {
  BiomeType,
  Position2D,
  Position3D,
  StructureType,
  Tile,
  World,
} from "../world/types";

// =============================================================================
// SELECTION TYPES
// =============================================================================

/**
 * Types of entities that can be selected
 * EXTENSION POINT: Add new entity types here
 */
export type SelectableEntityType = "colonist" | "item" | "structure" | "zone";

/**
 * No selection state
 */
export interface NoSelection {
  type: "none";
}

/**
 * A tile is selected
 */
export interface TileSelection {
  type: "tile";
  position: Position2D;
  zLevel: number;
}

/**
 * An entity is selected (single)
 */
export interface EntitySelection {
  type: "entity";
  entityType: SelectableEntityType;
  entityId: string;
  position?: Position2D;
}

/**
 * Multiple entities of the same type are selected
 */
export interface MultiEntitySelection {
  type: "multi-entity";
  entityType: SelectableEntityType;
  entityIds: Set<string>;
}

/**
 * Union of all selection states
 * EXTENSION POINT: Add new selection types here
 */
export type Selection =
  | NoSelection
  | TileSelection
  | EntitySelection
  | MultiEntitySelection;

// =============================================================================
// INTERACTION TYPES
// =============================================================================

/**
 * Available interaction modes
 * EXTENSION POINT: Add new modes like 'mine', 'build', 'zone'
 */
export type InteractionMode = "select" | "build" | "designate" | "zone";

// =============================================================================
// WORLD GENERATION CONFIG
// =============================================================================

/**
 * Configuration for world generation
 */
export interface WorldGenerationConfig {
  name: string;
  width: number;
  height: number;
  seed: number;
  biome: BiomeType;
}

// =============================================================================
// GAME STATE SHAPE
// =============================================================================

/**
 * The complete game state
 */
export interface GameState {
  // World state
  world: World | null;
  currentZLevel: number;
  worldConfig: WorldGenerationConfig | null;

  // Selection state
  selection: Selection;

  // Interaction state
  interactionMode: InteractionMode;
  hoverPosition: Position2D | null;

  // Simulation state
  simulation: SimulationStateSlice;

  // UI state
  isInitialized: boolean;
}

/**
 * Actions that modify game state
 */
export interface GameStateActions {
  // World actions
  setWorld: (world: World, config?: WorldGenerationConfig) => void;
  setCurrentZLevel: (zLevel: number) => void;
  updateTile: (
    position: Position2D,
    zLevel: number,
    changes: Partial<Tile>,
  ) => void;

  // Selection actions
  selectTile: (position: Position2D, zLevel: number) => void;
  selectEntity: (
    entityType: SelectableEntityType,
    entityId: string,
    position?: Position2D,
  ) => void;
  clearSelection: () => void;

  // Multi-selection actions
  addToSelection: (entityType: SelectableEntityType, entityId: string) => void;
  removeFromSelection: (entityId: string) => void;
  toggleSelection: (entityType: SelectableEntityType, entityId: string) => void;
  selectMultiple: (
    entityType: SelectableEntityType,
    entityIds: string[],
  ) => void;

  // Selection query helpers (non-reactive, for imperative use)
  isSelected: (entityId: string) => boolean;
  getSelectedIds: () => string[];

  // Interaction actions
  setInteractionMode: (mode: InteractionMode) => void;
  setHoverPosition: (position: Position2D | null) => void;

  // Initialization
  initialize: () => void;
  reset: () => void;
}

/**
 * Combined state and actions
 */
export type GameStore = GameState & GameStateActions & SimulationStateActions;

// =============================================================================
// HELPER TYPES
// =============================================================================

/**
 * Get tile at selection position if selection is a tile
 */
export interface SelectedTileInfo {
  position: Position2D;
  zLevel: number;
  tile: Tile;
}

/**
 * Get structure info if a structure is at the selected tile
 */
export interface SelectedStructureInfo {
  structureType: StructureType;
  position: Position2D;
  zLevel: number;
}

// =============================================================================
// SIMULATION STATE TYPES
// =============================================================================

/**
 * Simulation state for time control and entities
 */
export interface SimulationStateSlice {
  /** Whether simulation is running */
  isPlaying: boolean;
  /** Speed multiplier (1x, 2x, 4x) */
  speed: SimulationSpeed;
  /** Current simulation tick */
  currentTick: number;
  /** Characters indexed by ID */
  characters: Map<EntityId, Character>;
  /** Active job progress snapshots for rendering */
  jobProgress: Map<EntityId, JobProgressInfo>;
}

/**
 * Actions for simulation control
 */
export interface SimulationStateActions {
  // Time control
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  setSpeed: (speed: SimulationSpeed) => void;

  // Entity management
  addCharacter: (character: Character) => void;
  removeCharacter: (id: EntityId) => void;
  updateCharacter: (id: EntityId, changes: Partial<Character>) => void;
  getCharacter: (id: EntityId) => Character | undefined;
  getCharactersAtTile: (position: Position3D) => Character[];

  // Commands
  issueCommand: (characterId: EntityId, command: Command) => void;
  cancelCommand: (characterId: EntityId) => void;

  // Jobs
  assignJob: (job: Job) => void;
  cancelJob: (characterId: EntityId) => void;
}
