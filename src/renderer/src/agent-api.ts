// =============================================================================
// AGENT API — Exposes window.game for autonomous agent interaction
// =============================================================================

import type {
  AgentCharacterInfo,
  AgentTileInfo,
  AgentTileSpec,
  GameAgentApi,
} from "./agent-api.types";
import { commandRegistry } from "./commands";
import { useGameStore } from "./game-state";
import { entityStore } from "./simulation";
import {
  createChopJob,
  createMineJob,
  createMoveJob,
} from "./simulation/jobs/job-factory";
import type { Job } from "./simulation/jobs/types";
import {
  type Character,
  type CharacterType,
  createCharacter,
  type SimulationSpeed,
} from "./simulation/types";
import { generateWorld as generateWorldFactory } from "./world/factories/procedural-generator";
import {
  createFloorData,
  createStructureData,
  createTerrainData,
} from "./world/factories/tile-factory";
import { createWorld as createWorldFactory } from "./world/factories/world-factory";
import type {
  BiomeType,
  FloorType,
  SerializedWorld,
  StructureType,
  TerrainType,
  Tile,
} from "./world/types";
import { deserializeWorld, serializeWorld } from "./world/utils/serialization";
import { getWorldTileAt } from "./world/utils/tile-utils";

// =============================================================================
// HELPERS
// =============================================================================

const DEFAULT_TIMEOUT = 30_000;
const POLL_INTERVAL = 100;

/** Convert internal Character to agent-friendly plain object */
function toAgentCharacter(char: Character): AgentCharacterInfo {
  return {
    id: char.id,
    name: char.name,
    type: char.type,
    position: { ...char.position },
    isMoving: char.movement.isMoving,
    currentCommand: char.control.currentCommand?.type ?? null,
    needs: { ...char.needs },
  };
}

/** Find a character by name (case-insensitive) */
function findCharacterByName(name: string): Character | undefined {
  const lower = name.toLowerCase();
  for (const char of entityStore.values()) {
    if (char.name.toLowerCase() === lower) {
      return char;
    }
  }
  return undefined;
}

/** Poll until a condition is met or timeout expires */
function pollUntil(
  check: () => boolean,
  timeoutMs: number = DEFAULT_TIMEOUT,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const timer = setInterval(() => {
      if (check()) {
        clearInterval(timer);
        resolve();
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(timer);
        reject(new Error("Timed out waiting for action to complete"));
      }
    }, POLL_INTERVAL);
  });
}

/** Structure types that block movement */
const BLOCKING_STRUCTURES = new Set([
  "wall_stone",
  "wall_wood",
  "wall_metal",
  "wall_brick",
  "boulder",
]);

/** Apply an AgentTileSpec to an existing tile, returning partial Tile changes */
function applyTileSpec(existing: Tile, spec: AgentTileSpec): Partial<Tile> {
  const changes: Partial<Tile> = {};

  if (spec.terrain !== undefined) {
    changes.terrain = createTerrainData(spec.terrain as TerrainType);
  }

  if (spec.floor !== undefined) {
    changes.floor =
      spec.floor === null ? null : createFloorData(spec.floor as FloorType);
  }

  if (spec.structure !== undefined) {
    changes.structure =
      spec.structure === null
        ? null
        : createStructureData(spec.structure as StructureType);
  }

  // Determine passability
  if (spec.isPassable !== undefined) {
    changes.pathfinding = {
      ...existing.pathfinding,
      isPassable: spec.isPassable,
    };
  } else if (
    spec.structure !== undefined &&
    BLOCKING_STRUCTURES.has(spec.structure as string)
  ) {
    changes.pathfinding = {
      ...existing.pathfinding,
      isPassable: false,
    };
  } else if (spec.structure === null) {
    changes.pathfinding = {
      ...existing.pathfinding,
      isPassable: true,
    };
  }

  return changes;
}

/** Wait for a job to reach a terminal status */
async function waitForJob(job: Job): Promise<void> {
  await pollUntil(() => {
    return (
      job.status === "completed" ||
      job.status === "failed" ||
      job.status === "cancelled"
    );
  });

  if (job.status === "failed") {
    throw new Error(`Job ${job.type} failed`);
  }
  if (job.status === "cancelled") {
    throw new Error(`Job ${job.type} was cancelled`);
  }
}

// =============================================================================
// API FACTORY
// =============================================================================

function createAgentApi(): GameAgentApi {
  const api: GameAgentApi = {
    // =========================================================================
    // HIGH-LEVEL CONVENIENCE METHODS
    // =========================================================================

    selectCharacter(name: string) {
      const char = findCharacterByName(name);
      if (!char) return null;

      const state = useGameStore.getState();
      state.selectEntity("colonist", char.id, {
        x: char.position.x,
        y: char.position.y,
      });

      return toAgentCharacter(char);
    },

    async moveCharacter(name, target) {
      const char = findCharacterByName(name);
      if (!char) throw new Error(`Character "${name}" not found`);

      const state = useGameStore.getState();
      const z = state.currentZLevel;
      const pos = { x: target.x, y: target.y, z };

      const job = createMoveJob(char.id, pos);
      state.assignJob(job);

      await waitForJob(job);

      const updated = entityStore.get(char.id);
      if (!updated) throw new Error(`Character "${name}" not found after move`);
      return toAgentCharacter(updated);
    },

    async chopTree(name, target) {
      const char = findCharacterByName(name);
      if (!char) throw new Error(`Character "${name}" not found`);

      const state = useGameStore.getState();
      const z = state.currentZLevel;
      const pos = { x: target.x, y: target.y, z };

      const job = createChopJob(char.id, pos);
      state.assignJob(job);

      await waitForJob(job);
      return { success: true };
    },

    async mine(name, target) {
      const char = findCharacterByName(name);
      if (!char) throw new Error(`Character "${name}" not found`);

      const state = useGameStore.getState();
      const z = state.currentZLevel;
      const pos = { x: target.x, y: target.y, z };

      const job = createMineJob(char.id, pos);
      state.assignJob(job);

      await waitForJob(job);
      return { success: true };
    },

    cancelAction(name) {
      const char = findCharacterByName(name);
      if (!char) return;

      const state = useGameStore.getState();
      state.cancelJob(char.id);
      state.cancelCommand(char.id);
    },

    // =========================================================================
    // STATE QUERIES (getters via Object.defineProperty below)
    // =========================================================================

    // Placeholder values — overridden by defineProperty getters
    characters: [],
    selectedCharacter: null,
    world: null,
    simulation: { isPlaying: false, speed: 1, currentTick: 0 },

    getCharacter(name: string) {
      const char = findCharacterByName(name);
      return char ? toAgentCharacter(char) : null;
    },

    getTile(pos) {
      const state = useGameStore.getState();
      const world = state.world;
      if (!world) return null;

      const tile = getWorldTileAt(world, pos.x, pos.y, state.currentZLevel);
      if (!tile) return null;

      const info: AgentTileInfo = {
        terrain: tile.terrain.type,
        floor: tile.floor?.type ?? null,
        structure: tile.structure?.type ?? null,
        isPassable: tile.pathfinding.isPassable,
        items: tile.items.map((item) => ({
          type: item.type,
          quantity: item.quantity,
        })),
      };
      return info;
    },

    isTilePassable(pos) {
      const state = useGameStore.getState();
      const world = state.world;
      if (!world) return false;

      const tile = getWorldTileAt(world, pos.x, pos.y, state.currentZLevel);
      return tile?.pathfinding.isPassable ?? false;
    },

    // =========================================================================
    // SIMULATION CONTROL
    // =========================================================================

    play() {
      useGameStore.getState().play();
    },

    pause() {
      useGameStore.getState().pause();
    },

    setSpeed(speed: SimulationSpeed) {
      useGameStore.getState().setSpeed(speed);
    },

    // =========================================================================
    // WORLD SETUP
    // =========================================================================

    createWorld(options) {
      const width = options?.width ?? 20;
      const height = options?.height ?? 20;
      const name = options?.name ?? "Test World";

      const state = useGameStore.getState();
      state.reset();

      const world = createWorldFactory(name, {
        width,
        height,
        minZ: -1,
        maxZ: 1,
      });

      // If a custom terrain was requested, update all tiles on the surface level
      if (options?.terrain) {
        const level = world.levels.get(0);
        if (level) {
          for (const tile of level.tiles) {
            tile.terrain = createTerrainData(options.terrain as TerrainType);
          }
        }
      }

      state.setWorld(world);
      state.pause();
    },

    generateWorld(options) {
      const width = options?.width ?? 20;
      const height = options?.height ?? 20;
      const name = options?.name ?? "Test World";

      const state = useGameStore.getState();
      state.reset();

      const world = generateWorldFactory(name, width, height, {
        seed: options?.seed,
        biome: options?.biome as BiomeType | undefined,
      });

      state.setWorld(world);
      state.pause();
    },

    reset() {
      useGameStore.getState().reset();
    },

    // =========================================================================
    // TILE MANIPULATION
    // =========================================================================

    setTile(x, y, spec, z) {
      const state = useGameStore.getState();
      const world = state.world;
      if (!world) throw new Error("No world loaded");

      const zLevel = z ?? 0;
      const tile = getWorldTileAt(world, x, y, zLevel);
      if (!tile) throw new Error(`Tile (${x}, ${y}, ${zLevel}) out of bounds`);

      const changes = applyTileSpec(tile, spec);
      state.updateTile({ x, y }, zLevel, changes);
    },

    fillRect(x1, y1, x2, y2, spec, z) {
      const state = useGameStore.getState();
      const world = state.world;
      if (!world) throw new Error("No world loaded");

      const zLevel = z ?? 0;
      const minX = Math.min(x1, x2);
      const maxX = Math.max(x1, x2);
      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const tile = getWorldTileAt(world, x, y, zLevel);
          if (tile) {
            const changes = applyTileSpec(tile, spec);
            state.updateTile({ x, y }, zLevel, changes);
          }
        }
      }
    },

    buildRoom(x1, y1, x2, y2, options) {
      const wallType = options?.wallType ?? "wall_stone";
      const doorType = options?.doorType ?? "door_wood";
      const doorSide = options?.doorSide;
      const doorOffset = options?.doorOffset ?? 0;
      const zLevel = options?.z ?? 0;

      const state = useGameStore.getState();
      const world = state.world;
      if (!world) throw new Error("No world loaded");

      const minX = Math.min(x1, x2);
      const maxX = Math.max(x1, x2);
      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);

      // Compute door position
      let doorX = -1;
      let doorY = -1;
      if (doorSide) {
        switch (doorSide) {
          case "north": {
            doorX = Math.floor((minX + maxX) / 2) + doorOffset;
            doorY = minY;
            break;
          }
          case "south": {
            doorX = Math.floor((minX + maxX) / 2) + doorOffset;
            doorY = maxY;
            break;
          }
          case "east": {
            doorX = maxX;
            doorY = Math.floor((minY + maxY) / 2) + doorOffset;
            break;
          }
          case "west": {
            doorX = minX;
            doorY = Math.floor((minY + maxY) / 2) + doorOffset;
            break;
          }
        }
      }

      // Set perimeter tiles
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const isPerimeter =
            x === minX || x === maxX || y === minY || y === maxY;
          if (!isPerimeter) continue;

          const tile = getWorldTileAt(world, x, y, zLevel);
          if (!tile) continue;

          if (doorSide && x === doorX && y === doorY) {
            // Place door
            const changes = applyTileSpec(tile, {
              structure: doorType,
              isPassable: true,
            });
            state.updateTile({ x, y }, zLevel, changes);
          } else {
            // Place wall
            const changes = applyTileSpec(tile, {
              structure: wallType,
            });
            state.updateTile({ x, y }, zLevel, changes);
          }
        }
      }
    },

    // =========================================================================
    // ENTITY MANAGEMENT
    // =========================================================================

    spawnCharacter(name, x, y, options) {
      const z = options?.z ?? 0;
      const character = createCharacter({
        name,
        position: { x, y, z },
        type: (options?.type as CharacterType) ?? "colonist",
        color: options?.color,
        needs: options?.needs
          ? {
              hunger: options.needs.hunger ?? 1,
              energy: options.needs.energy ?? 1,
              mood: options.needs.mood ?? 1,
            }
          : undefined,
      });

      const state = useGameStore.getState();
      state.addCharacter(character);

      return toAgentCharacter(character);
    },

    removeCharacter(name) {
      const char = findCharacterByName(name);
      if (!char) return false;

      const state = useGameStore.getState();
      state.removeCharacter(char.id);
      return true;
    },

    teleportCharacter(name, x, y, z) {
      const char = findCharacterByName(name);
      if (!char) throw new Error(`Character "${name}" not found`);

      const state = useGameStore.getState();

      // Cancel active jobs/commands
      state.cancelJob(char.id);
      state.cancelCommand(char.id);

      // Update position and reset movement state
      state.updateCharacter(char.id, {
        position: { x, y, z: z ?? 0 },
        movement: {
          ...char.movement,
          isMoving: false,
          path: null,
          pathIndex: 0,
          progress: 0,
        },
      });

      const updated = entityStore.get(char.id);
      if (!updated)
        throw new Error(`Character "${name}" not found after teleport`);
      return toAgentCharacter(updated);
    },

    // =========================================================================
    // SNAPSHOTS
    // =========================================================================

    saveSnapshot() {
      const state = useGameStore.getState();
      const world = state.world;
      if (!world) throw new Error("No world loaded");

      const snapshot = {
        version: 1,
        world: serializeWorld(world),
        entities: entityStore.toJSON(),
        simulation: {
          currentTick: state.simulation.currentTick,
          speed: state.simulation.speed,
        },
      };

      return JSON.stringify(snapshot);
    },

    loadSnapshot(json) {
      const snapshot = JSON.parse(json) as {
        version: number;
        world: SerializedWorld;
        entities: Character[];
        simulation: { currentTick: number; speed: SimulationSpeed };
      };

      const world = deserializeWorld(snapshot.world);

      const state = useGameStore.getState();
      state.reset();
      state.setWorld(world);
      state.pause();

      // Restore entities
      for (const entity of snapshot.entities) {
        state.addCharacter(entity);
      }

      // Restore simulation state
      state.setSpeed(snapshot.simulation.speed);
    },

    // =========================================================================
    // LOW-LEVEL COMMAND ACCESS
    // =========================================================================

    commands: {
      dispatch(commandId: string, payload?: unknown) {
        return commandRegistry.dispatch(commandId, payload);
      },
      list() {
        return commandRegistry.getAllCommands().map((cmd) => ({
          id: cmd.id,
          name: cmd.name,
        }));
      },
    },
  };

  // Define dynamic getters that always return fresh state
  Object.defineProperty(api, "characters", {
    get() {
      return entityStore.getAll().map(toAgentCharacter);
    },
    enumerable: true,
  });

  Object.defineProperty(api, "selectedCharacter", {
    get() {
      const state = useGameStore.getState();
      if (
        state.selection.type === "entity" &&
        state.selection.entityType === "colonist"
      ) {
        const char = entityStore.get(state.selection.entityId);
        return char ? toAgentCharacter(char) : null;
      }
      return null;
    },
    enumerable: true,
  });

  Object.defineProperty(api, "world", {
    get() {
      const state = useGameStore.getState();
      const world = state.world;
      if (!world) return null;
      return {
        name: world.metadata.name,
        width: world.dimensions.width,
        height: world.dimensions.height,
        time: {
          day: world.time.day,
          hour: world.time.hour,
          minute: world.time.minute,
          season: world.time.season,
          year: world.time.year,
        },
        weather: {
          type: world.weather.type,
          temperature: world.weather.temperature,
        },
      };
    },
    enumerable: true,
  });

  Object.defineProperty(api, "simulation", {
    get() {
      const sim = useGameStore.getState().simulation;
      return {
        isPlaying: sim.isPlaying,
        speed: sim.speed,
        currentTick: sim.currentTick,
      };
    },
    enumerable: true,
  });

  return api;
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/** Initialize the agent API and attach it to window.game */
export function initAgentApi(): void {
  window.game = createAgentApi();
}
