// =============================================================================
// AGENT API — Exposes window.game for autonomous agent interaction
// =============================================================================

import type {
  AgentCharacterInfo,
  AgentSkillInfo,
  AgentTileInfo,
  AgentTileSpec,
  GameAgentApi,
} from "./agent-api.types";
import { commandRegistry } from "./commands";
import { roomDetection, useGameStore } from "./game-state";
import { entityStore } from "./simulation";
import { BODY_PART_DEFINITIONS } from "./simulation/health/body-parts";
import {
  createChopJob,
  createMineJob,
  createMineTerrainJob,
  createMoveJob,
} from "./simulation/jobs/job-factory";
import type { Job } from "./simulation/jobs/types";
import { isValidScheduleActivity, type Schedule } from "./simulation/schedule";
import { getThoughtDefinition } from "./simulation/thoughts";
import {
  type Character,
  type CharacterType,
  createCharacter,
  type SimulationSpeed,
} from "./simulation/types";
import {
  ALL_WORK_TYPES,
  type WorkPriorityLevel,
  type WorkType,
} from "./simulation/work-priorities";
import { generateWorld as generateWorldFactory } from "./world/factories/procedural-generator";
import {
  createFloorData,
  createStructureData,
  createTerrainData,
} from "./world/factories/tile-factory";
import { createWorld as createWorldFactory } from "./world/factories/world-factory";
import {
  getConstructionCost,
  isBuildable,
} from "./world/registries/construction-registry";
import {
  getFloorConstructionCost,
  isFloorBuildable,
} from "./world/registries/floor-registry";
import { STRUCTURE_REGISTRY } from "./world/registries/structure-registry";
import { TERRAIN_REGISTRY } from "./world/registries/terrain-registry";
import type {
  BiomeType,
  CropType,
  FloorType,
  ItemCategory,
  ItemType,
  SerializedWorld,
  StructureType,
  TerrainType,
  Tile,
} from "./world/types";
import {
  countAllItemsOnMap,
  hasSufficientMaterials,
} from "./world/utils/material-counter";
import { deserializeWorld, serializeWorld } from "./world/utils/serialization";
import { getWorldTileAt } from "./world/utils/tile-utils";
import { useZoneStore } from "./zones";
import type { StockpileFilter } from "./zones/stockpile-filter";
import type { AgentZoneInfo, ZoneType } from "./zones/types";

// =============================================================================
// HELPERS
// =============================================================================

const DEFAULT_TIMEOUT = 30_000;
const POLL_INTERVAL = 100;

/** Convert internal Character to agent-friendly plain object */
function toAgentCharacter(char: Character): AgentCharacterInfo {
  // Convert skills to plain agent format
  const skills: Record<string, AgentSkillInfo> = {};
  for (const [id, data] of Object.entries(char.skills)) {
    skills[id] = {
      level: data.level,
      experience: data.experience,
      passion: data.passion,
    };
  }

  return {
    id: char.id,
    name: char.name,
    type: char.type,
    position: { ...char.position },
    isMoving: char.movement.isMoving,
    currentCommand: char.control.currentCommand?.type ?? null,
    needs: { ...char.needs },
    biography: {
      age: char.biography.age,
      gender: char.biography.gender,
      firstName: char.biography.firstName,
      lastName: char.biography.lastName,
      nickname: char.biography.nickname,
    },
    traits: [...char.traits],
    skills,
    thoughts: char.thoughts.map((t) => {
      const def = getThoughtDefinition(t.thoughtId);
      return {
        id: t.thoughtId,
        label: def?.label ?? t.thoughtId,
        moodEffect: def?.moodEffect ?? 0,
      };
    }),
    mentalBreak: char.mentalBreak
      ? {
          type: char.mentalBreak.type,
          startedAtTick: char.mentalBreak.startedAtTick,
        }
      : null,
    isDrafted: char.control.mode === "drafted",
    workPriorities: { ...char.workPriorities },
    schedule: [...char.schedule],
    allowedAreaId: char.allowedAreaId,
    bodyParts: BODY_PART_DEFINITIONS.map((def) => ({
      id: def.id,
      label: def.label,
      health: char.bodyParts[def.id].health,
      maxHealth: char.bodyParts[def.id].maxHealth,
    })),
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

    lockDoor(x: number, y: number, z?: number) {
      const state = useGameStore.getState();
      const world = state.world;
      if (!world) throw new Error("No world loaded");

      const zLevel = z ?? state.currentZLevel;
      const tile = getWorldTileAt(world, x, y, zLevel);
      if (!tile) throw new Error(`Tile (${x}, ${y}, ${zLevel}) out of bounds`);

      if (
        !tile.structure ||
        STRUCTURE_REGISTRY[tile.structure.type].category !== "door"
      ) {
        throw new Error(`No door at (${x}, ${y}, ${zLevel})`);
      }

      tile.structure.isLocked = true;
      state.updateTile({ x, y }, zLevel, {
        pathfinding: {
          isPassable: false,
          movementCost: tile.pathfinding.movementCost,
          lastUpdated: Date.now(),
        },
      });
    },

    unlockDoor(x: number, y: number, z?: number) {
      const state = useGameStore.getState();
      const world = state.world;
      if (!world) throw new Error("No world loaded");

      const zLevel = z ?? state.currentZLevel;
      const tile = getWorldTileAt(world, x, y, zLevel);
      if (!tile) throw new Error(`Tile (${x}, ${y}, ${zLevel}) out of bounds`);

      if (
        !tile.structure ||
        STRUCTURE_REGISTRY[tile.structure.type].category !== "door"
      ) {
        throw new Error(`No door at (${x}, ${y}, ${zLevel})`);
      }

      tile.structure.isLocked = false;
      state.updateTile({ x, y }, zLevel, {
        pathfinding: {
          isPassable: true,
          movementCost: tile.pathfinding.movementCost,
          lastUpdated: Date.now(),
        },
      });
    },

    cancelAction(name) {
      const char = findCharacterByName(name);
      if (!char) return;

      const state = useGameStore.getState();
      state.cancelJob(char.id);
      state.cancelCommand(char.id);
    },

    draftCharacter(name) {
      const char = findCharacterByName(name);
      if (!char) return null;

      useGameStore.getState().draftCharacter(char.id);
      const updated = entityStore.get(char.id);
      return updated ? toAgentCharacter(updated) : null;
    },

    undraftCharacter(name) {
      const char = findCharacterByName(name);
      if (!char) return null;

      useGameStore.getState().undraftCharacter(char.id);
      const updated = entityStore.get(char.id);
      return updated ? toAgentCharacter(updated) : null;
    },

    setWorkPriority(name: string, workType: string, priority: number) {
      const char = findCharacterByName(name);
      if (!char) throw new Error(`Character "${name}" not found`);

      if (!ALL_WORK_TYPES.includes(workType as WorkType)) {
        throw new Error(
          `Invalid work type "${workType}". Valid types: ${ALL_WORK_TYPES.join(", ")}`,
        );
      }
      if (priority < 0 || priority > 4 || !Number.isInteger(priority)) {
        throw new Error("Priority must be an integer 0-4");
      }

      useGameStore.getState().updateCharacter(char.id, {
        workPriorities: {
          ...char.workPriorities,
          [workType]: priority as WorkPriorityLevel,
        },
      });
    },

    getWorkPriorities(name: string) {
      const char = findCharacterByName(name);
      if (!char) return null;
      return { ...char.workPriorities };
    },

    setSchedule(name: string, schedule: string[]) {
      const char = findCharacterByName(name);
      if (!char) throw new Error(`Character "${name}" not found`);

      if (!Array.isArray(schedule) || schedule.length !== 24) {
        throw new Error(
          "Schedule must be an array of exactly 24 activity strings",
        );
      }
      for (let i = 0; i < 24; i++) {
        if (!isValidScheduleActivity(schedule[i])) {
          throw new Error(
            `Invalid schedule activity "${schedule[i]}" at hour ${i}. Valid: work, sleep, recreation, anything`,
          );
        }
      }

      useGameStore.getState().updateCharacter(char.id, {
        schedule: schedule as unknown as Schedule,
      });
    },

    getSchedule(name: string) {
      const char = findCharacterByName(name);
      if (!char) return null;
      return [...char.schedule];
    },

    setAllowedArea(name: string, zoneId: string) {
      const char = findCharacterByName(name);
      if (!char) return `Character "${name}" not found`;
      const zone = useZoneStore.getState().zones.get(zoneId);
      if (!zone || zone.type !== "allowed_area") {
        return `Zone "${zoneId}" not found or not an allowed_area zone`;
      }
      useGameStore.getState().updateCharacter(char.id, {
        allowedAreaId: zoneId,
      });
      return "ok";
    },

    clearAllowedArea(name: string) {
      const char = findCharacterByName(name);
      if (!char) return `Character "${name}" not found`;
      useGameStore.getState().updateCharacter(char.id, {
        allowedAreaId: null,
      });
      return "ok";
    },

    // =========================================================================
    // STATE QUERIES (getters via Object.defineProperty below)
    // =========================================================================

    // Placeholder values — overridden by defineProperty getters
    characters: [],
    selectedCharacter: null,
    world: null,
    simulation: {
      isPlaying: false,
      speed: 1,
      currentTick: 0,
      activeEvents: [],
    },

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

      const room = roomDetection.getRoomAt(pos.x, pos.y, state.currentZLevel);
      const outdoorTemp = world.weather.temperature;
      const info: AgentTileInfo = {
        terrain: tile.terrain.type,
        floor: tile.floor?.type ?? null,
        structure: tile.structure?.type ?? null,
        isPassable: tile.pathfinding.isPassable,
        isRoofed: room?.isRoofed ?? false,
        temperature: room?.temperature ?? outdoorTemp,
        items: tile.items.map((item) => ({
          type: item.type,
          quantity: item.quantity,
        })),
      };

      // Expose door state if structure is a door
      if (
        tile.structure &&
        STRUCTURE_REGISTRY[tile.structure.type].category === "door"
      ) {
        info.door = {
          isOpen: tile.structure.isOpen ?? false,
          isLocked: tile.structure.isLocked ?? false,
        };
      }

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
              comfort: options.needs.comfort ?? 1,
              recreation: options.needs.recreation ?? 1,
              social: options.needs.social ?? 1,
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
    // ZONE MANAGEMENT
    // =========================================================================

    zones: {
      create(
        type: string,
        name: string,
        tiles?: Array<{ x: number; y: number }>,
        z?: number,
      ): AgentZoneInfo {
        const zoneStore = useZoneStore.getState();
        const zLevel = z ?? 0;
        const id = zoneStore.createZone(type as ZoneType, name, zLevel);
        if (tiles && tiles.length > 0) {
          zoneStore.addTiles(
            id,
            tiles.map((t) => `${t.x},${t.y}`),
          );
        }
        const zone = useZoneStore.getState().zones.get(id)!;
        return {
          id: zone.id,
          type: zone.type,
          name: zone.name,
          zLevel: zone.zLevel,
          tileCount: zone.tiles.size,
          priority: zone.priority,
        };
      },
      delete(zoneId: string): void {
        useZoneStore.getState().deleteZone(zoneId);
      },
      addTiles(zoneId: string, tiles: Array<{ x: number; y: number }>): void {
        useZoneStore.getState().addTiles(
          zoneId,
          tiles.map((t) => `${t.x},${t.y}`),
        );
      },
      removeTiles(
        zoneId: string,
        tiles: Array<{ x: number; y: number }>,
      ): void {
        useZoneStore.getState().removeTiles(
          zoneId,
          tiles.map((t) => `${t.x},${t.y}`),
        );
      },
      list(): AgentZoneInfo[] {
        return useZoneStore
          .getState()
          .getAllZones()
          .map((zone) => ({
            id: zone.id,
            type: zone.type,
            name: zone.name,
            zLevel: zone.zLevel,
            tileCount: zone.tiles.size,
            priority: zone.priority,
          }));
      },
      get(zoneId: string): AgentZoneInfo | null {
        const zone = useZoneStore.getState().zones.get(zoneId);
        if (!zone) return null;
        return {
          id: zone.id,
          type: zone.type,
          name: zone.name,
          zLevel: zone.zLevel,
          tileCount: zone.tiles.size,
          priority: zone.priority,
        };
      },
      setFilter(
        zoneId: string,
        config: {
          allowedCategories?: string[];
          disallowedTypes?: string[];
        },
      ): void {
        const zone = useZoneStore.getState().zones.get(zoneId);
        if (!zone || zone.type !== "stockpile") {
          throw new Error(`Zone "${zoneId}" not found or is not a stockpile`);
        }
        const filter: StockpileFilter = {
          allowedCategories: new Set(
            (config.allowedCategories ?? []) as ItemCategory[],
          ),
          disallowedTypes: new Set(
            (config.disallowedTypes ?? []) as ItemType[],
          ),
        };
        useZoneStore.getState().setStockpileFilter(zoneId, filter);
      },
      getFilter(zoneId: string): {
        allowedCategories: string[];
        disallowedTypes: string[];
      } | null {
        const zone = useZoneStore.getState().zones.get(zoneId);
        if (!zone || zone.type !== "stockpile") return null;
        if (!zone.filter) return null;
        return {
          allowedCategories: Array.from(zone.filter.allowedCategories),
          disallowedTypes: Array.from(zone.filter.disallowedTypes),
        };
      },
      clearAll(): void {
        useZoneStore.getState().clearAll();
      },
    },

    // =========================================================================
    // PLANT MANAGEMENT
    // =========================================================================

    setGrowingZoneCrop(zoneId: string, cropType: string) {
      const zone = useZoneStore.getState().zones.get(zoneId);
      if (!zone || zone.type !== "growing") {
        throw new Error(`Zone "${zoneId}" not found or is not a growing zone`);
      }
      useZoneStore.getState().setGrowingZoneCrop(zoneId, cropType);
    },

    plantCrop(x: number, y: number, cropType: string, z?: number) {
      const state = useGameStore.getState();
      const world = state.world;
      if (!world) throw new Error("No world loaded");

      const zLevel = z ?? 0;
      const tile = getWorldTileAt(world, x, y, zLevel);
      if (!tile) throw new Error(`Tile (${x}, ${y}, ${zLevel}) out of bounds`);

      tile.crop = {
        type: cropType as CropType,
        growthProgress: 0,
        stage: "seedling",
        plantedDay: world.time.day,
      };
    },

    // =========================================================================
    // CONSTRUCTION
    // =========================================================================

    placeBlueprint(x: number, y: number, structureType: string, z?: number) {
      const state = useGameStore.getState();
      const world = state.world;
      if (!world) throw new Error("No world loaded");

      const zLevel = z ?? 0;
      const tile = getWorldTileAt(world, x, y, zLevel);
      if (!tile) throw new Error(`Tile (${x}, ${y}, ${zLevel}) out of bounds`);

      if (!isBuildable(structureType as StructureType)) {
        throw new Error(`Structure type "${structureType}" is not buildable`);
      }

      if (tile.structure !== null) {
        throw new Error(
          `Tile (${x}, ${y}) already has a structure: ${tile.structure.type}`,
        );
      }

      // Check material availability
      const cost = getConstructionCost(structureType as StructureType);
      if (cost) {
        const check = hasSufficientMaterials(world, cost.materials, (type) =>
          getConstructionCost(type as StructureType),
        );
        if (!check.sufficient) {
          const details = check.missing
            .map((m) => `${m.type}: need ${m.needed}, have ${m.available}`)
            .join(", ");
          throw new Error(
            `Insufficient materials for ${structureType}: ${details}`,
          );
        }
      }

      tile.blueprint = createStructureData(structureType as StructureType);
    },

    cancelBlueprint(x: number, y: number, z?: number) {
      const state = useGameStore.getState();
      const world = state.world;
      if (!world) throw new Error("No world loaded");

      const zLevel = z ?? 0;
      const tile = getWorldTileAt(world, x, y, zLevel);
      if (!tile) throw new Error(`Tile (${x}, ${y}, ${zLevel}) out of bounds`);

      tile.blueprint = null;
    },

    buildFloor(x: number, y: number, floorType: string, z?: number) {
      const state = useGameStore.getState();
      const world = state.world;
      if (!world) throw new Error("No world loaded");

      const zLevel = z ?? 0;
      const tile = getWorldTileAt(world, x, y, zLevel);
      if (!tile) throw new Error(`Tile (${x}, ${y}, ${zLevel}) out of bounds`);

      if (!isFloorBuildable(floorType as FloorType)) {
        throw new Error(`Floor type "${floorType}" is not buildable`);
      }

      if (tile.floor !== null && tile.floor.type !== "none") {
        throw new Error(
          `Tile (${x}, ${y}) already has a floor: ${tile.floor.type}`,
        );
      }

      // Check material availability
      const cost = getFloorConstructionCost(floorType as FloorType);
      if (cost) {
        const check = hasSufficientMaterials(world, cost.materials, (type) =>
          getConstructionCost(type as StructureType),
        );
        if (!check.sufficient) {
          const details = check.missing
            .map((m) => `${m.type}: need ${m.needed}, have ${m.available}`)
            .join(", ");
          throw new Error(
            `Insufficient materials for ${floorType}: ${details}`,
          );
        }
      }

      // Directly place the floor (floor building is simpler than structure building)
      tile.floor = { type: floorType as FloorType, condition: 1.0 };
    },

    mineTerrain(
      name: string,
      target: { x: number; y: number },
      z?: number,
    ): Promise<{ success: boolean }> {
      const char = findCharacterByName(name);
      if (!char) throw new Error(`Character "${name}" not found`);

      const state = useGameStore.getState();
      const zLevel = z ?? state.currentZLevel;
      const world = state.world;
      if (!world) throw new Error("No world loaded");

      const tile = getWorldTileAt(world, target.x, target.y, zLevel);
      if (!tile)
        throw new Error(`Tile (${target.x}, ${target.y}) out of bounds`);

      const terrainProps = TERRAIN_REGISTRY[tile.terrain.type];
      if (!terrainProps.isDiggable || terrainProps.hardness < 0.7) {
        throw new Error(
          `Terrain "${tile.terrain.type}" is not mineable (requires hardness >= 0.7)`,
        );
      }

      const pos = { x: target.x, y: target.y, z: zLevel };
      const job = createMineTerrainJob(char.id, pos, tile.terrain.type);
      state.assignJob(job);

      return waitForJob(job).then(() => ({ success: true }));
    },

    getAvailableMaterials(): Record<string, number> {
      const state = useGameStore.getState();
      const world = state.world;
      if (!world) throw new Error("No world loaded");

      const counts = countAllItemsOnMap(world);
      const result: Record<string, number> = {};
      for (const [type, qty] of counts) {
        result[type] = qty;
      }
      return result;
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
          forecast: world.weather.forecast,
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
        activeEvents: Array.from(sim.activeEvents),
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
