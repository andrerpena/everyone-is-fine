// =============================================================================
// AGENT API TYPES — Simplified plain-object types for agent consumption
// =============================================================================

import type { Position3D } from "./world/types";

/** Character biography exposed to agents */
export interface AgentBiography {
  age: number;
  gender: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
}

/** Skill data exposed to agents */
export interface AgentSkillInfo {
  level: number;
  experience: number;
  passion: string;
}

/** Active thought exposed to agents */
export interface AgentThoughtInfo {
  id: string;
  label: string;
  moodEffect: number;
}

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
  biography: AgentBiography;
  traits: string[];
  skills: Record<string, AgentSkillInfo>;
  thoughts: AgentThoughtInfo[];
  mentalBreak: { type: string; startedAtTick: number } | null;
  isDrafted: boolean;
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
  draftCharacter: (name: string) => AgentCharacterInfo | null;
  undraftCharacter: (name: string) => AgentCharacterInfo | null;

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

  // Zone management
  zones: {
    create: (
      type: string,
      name: string,
      tiles?: Array<{ x: number; y: number }>,
      z?: number,
    ) => {
      id: string;
      type: string;
      name: string;
      zLevel: number;
      tileCount: number;
    };
    delete: (zoneId: string) => void;
    addTiles: (zoneId: string, tiles: Array<{ x: number; y: number }>) => void;
    removeTiles: (
      zoneId: string,
      tiles: Array<{ x: number; y: number }>,
    ) => void;
    list: () => Array<{
      id: string;
      type: string;
      name: string;
      zLevel: number;
      tileCount: number;
    }>;
    get: (zoneId: string) => {
      id: string;
      type: string;
      name: string;
      zLevel: number;
      tileCount: number;
    } | null;
    setFilter: (
      zoneId: string,
      config: {
        allowedCategories?: string[];
        disallowedTypes?: string[];
      },
    ) => void;
    getFilter: (zoneId: string) => {
      allowedCategories: string[];
      disallowedTypes: string[];
    } | null;
    clearAll: () => void;
  };

  // Plant management
  plantCrop: (x: number, y: number, cropType: string, z?: number) => void;

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
