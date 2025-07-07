// =============================================================================
// AGENT API TYPES — Simplified plain-object types for agent consumption
// =============================================================================

import type { Position3D } from "./world/types";

/** Character info exposed to agents */
export interface AgentCharacterInfo {
  id: string;
  name: string;
  type: string;
  position: Position3D;
  isMoving: boolean;
  currentCommand: string | null;
  needs: {
    hunger: number;
    energy: number;
    mood: number;
  };
}

/** Tile info exposed to agents */
export interface AgentTileInfo {
  terrain: string;
  floor: string | null;
  structure: string | null;
  isPassable: boolean;
  items: Array<{ type: string; quantity: number }>;
}

/** World metadata exposed to agents */
export interface AgentWorldInfo {
  name: string;
  width: number;
  height: number;
  time: {
    day: number;
    hour: number;
    minute: number;
    season: string;
    year: number;
  };
  weather: {
    type: string;
    temperature: number;
  };
}

/** Simulation state exposed to agents */
export interface AgentSimulationInfo {
  isPlaying: boolean;
  speed: number;
  currentTick: number;
}

/** Partial tile specification for world-building */
export interface AgentTileSpec {
  terrain?: string;
  floor?: string | null;
  structure?: string | null;
  isPassable?: boolean;
}

/** The full agent API shape */
export interface GameAgentApi {
  // High-level convenience methods
  selectCharacter: (name: string) => AgentCharacterInfo | null;
  moveCharacter: (
    name: string,
    target: { x: number; y: number },
  ) => Promise<AgentCharacterInfo>;
  chopTree: (
    name: string,
    target: { x: number; y: number },
  ) => Promise<{ success: boolean }>;
  mine: (
    name: string,
    target: { x: number; y: number },
  ) => Promise<{ success: boolean }>;
  cancelAction: (name: string) => void;

  // State queries
  characters: AgentCharacterInfo[];
  selectedCharacter: AgentCharacterInfo | null;
  getCharacter: (name: string) => AgentCharacterInfo | null;
  world: AgentWorldInfo | null;
  getTile: (pos: { x: number; y: number }) => AgentTileInfo | null;
  isTilePassable: (pos: { x: number; y: number }) => boolean;
  simulation: AgentSimulationInfo;

  // Simulation control
  play: () => void;
  pause: () => void;
  setSpeed: (speed: 1 | 2 | 4) => void;

  // World setup
  createWorld: (options?: {
    width?: number;
    height?: number;
    terrain?: string;
    name?: string;
  }) => void;
  generateWorld: (options?: {
    width?: number;
    height?: number;
    seed?: number;
    biome?: string;
    name?: string;
  }) => void;
  reset: () => void;

  // Tile manipulation
  setTile: (x: number, y: number, spec: AgentTileSpec, z?: number) => void;
  fillRect: (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    spec: AgentTileSpec,
    z?: number,
  ) => void;
  buildRoom: (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    options?: {
      wallType?: string;
      doorSide?: "north" | "south" | "east" | "west";
      doorOffset?: number;
      doorType?: string;
      z?: number;
    },
  ) => void;

  // Entity management
  spawnCharacter: (
    name: string,
    x: number,
    y: number,
    options?: {
      type?: string;
      z?: number;
      color?: number;
      needs?: { hunger?: number; energy?: number; mood?: number };
    },
  ) => AgentCharacterInfo;
  removeCharacter: (name: string) => boolean;
  teleportCharacter: (
    name: string,
    x: number,
    y: number,
    z?: number,
  ) => AgentCharacterInfo;

  // Snapshots
  saveSnapshot: () => string;
  loadSnapshot: (json: string) => void;

  // Low-level command access
  commands: {
    dispatch: (commandId: string, payload?: unknown) => Promise<void>;
    list: () => Array<{ id: string; name: string }>;
  };
}

// Augment the global Window interface
declare global {
  interface Window {
    game: GameAgentApi;
  }
}
