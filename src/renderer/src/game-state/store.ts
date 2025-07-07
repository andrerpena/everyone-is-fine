// =============================================================================
// GAME STATE ZUSTAND STORE
// =============================================================================

import { create } from "zustand";
import { commandRegistry } from "../commands";
import { logger } from "../lib/logger";
import {
  entityStore,
  findPath,
  MovementSystem,
  simulationLoop,
} from "../simulation";
import { JobProcessor } from "../simulation/jobs";
import type { Job } from "../simulation/jobs/types";
import type {
  Character,
  Command,
  EntityId,
  MoveCommand,
  SimulationSpeed,
} from "../simulation/types";
import type { Position2D, Position3D, Tile, World } from "../world/types";
import { getTileAt, setTileAt } from "../world/utils/tile-utils";
import type {
  GameStore,
  InteractionMode,
  MultiEntitySelection,
  SelectableEntityType,
  Selection,
  SimulationStateSlice,
  WorldGenerationConfig,
} from "./types";

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialSimulationState: SimulationStateSlice = {
  isPlaying: false,
  speed: 1,
  currentTick: 0,
  characters: new Map(),
  jobProgress: new Map(),
};

const initialState = {
  // World
  world: null,
  currentZLevel: 0,
  worldConfig: null,

  // Selection
  selection: { type: "none" } as Selection,

  // Interaction
  interactionMode: "select" as InteractionMode,
  hoverPosition: null,

  // Simulation
  simulation: initialSimulationState,

  // UI
  isInitialized: false,
};

// =============================================================================
// MOVEMENT SYSTEM & JOB PROCESSOR SETUP
// =============================================================================

const movementSystem = new MovementSystem(entityStore);

// =============================================================================
// STORE CREATION
// =============================================================================

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  // ===========================================================================
  // WORLD ACTIONS
  // ===========================================================================

  setWorld: (world: World, config?: WorldGenerationConfig) => {
    logger.info(
      `Loading world: ${world.metadata.name} (${world.dimensions.width}x${world.dimensions.height})`,
      ["game", "world"],
    );

    // Clear existing entities when setting a new world
    entityStore.clear();

    set({
      world,
      worldConfig: config ?? null,
      currentZLevel: world.surfaceZ,
      isInitialized: true,
      simulation: {
        ...get().simulation,
        characters: new Map(),
      },
    });

    // Auto-start the simulation when the world is loaded
    get().play();
  },

  setCurrentZLevel: (zLevel: number) => {
    const { world, currentZLevel: previousZ } = get();
    if (!world) return;

    // Clamp to valid range
    const clampedZ = Math.max(
      world.dimensions.minZ,
      Math.min(world.dimensions.maxZ, zLevel),
    );

    if (clampedZ !== previousZ) {
      set({ currentZLevel: clampedZ });

      // Dispatch action
      commandRegistry.dispatch("world.zLevelChanged", {
        previousZ,
        currentZ: clampedZ,
      });
    }
  },

  updateTile: (
    position: Position2D,
    zLevel: number,
    changes: Partial<Tile>,
  ) => {
    const { world } = get();
    if (!world) return;

    const level = world.levels.get(zLevel);
    if (!level) return;

    const currentTile = getTileAt(level, position.x, position.y);
    if (!currentTile) return;

    // Merge changes into tile
    const updatedTile: Tile = {
      ...currentTile,
      ...changes,
      terrain: changes.terrain
        ? { ...currentTile.terrain, ...changes.terrain }
        : currentTile.terrain,
      floor: changes.floor !== undefined ? changes.floor : currentTile.floor,
      structure:
        changes.structure !== undefined
          ? changes.structure
          : currentTile.structure,
      pathfinding: changes.pathfinding
        ? { ...currentTile.pathfinding, ...changes.pathfinding }
        : currentTile.pathfinding,
      visibility: changes.visibility
        ? { ...currentTile.visibility, ...changes.visibility }
        : currentTile.visibility,
    };

    // Update tile in level
    setTileAt(level, position.x, position.y, updatedTile);

    // Dispatch action
    commandRegistry.dispatch("world.tileUpdated", {
      position,
      zLevel,
      changes,
      tile: updatedTile,
    });
  },

  // ===========================================================================
  // SELECTION ACTIONS
  // ===========================================================================

  selectTile: (position: Position2D, zLevel: number) => {
    const { world } = get();
    if (!world) return;

    const level = world.levels.get(zLevel);
    if (!level) return;

    const tile = getTileAt(level, position.x, position.y);
    if (!tile) return;

    set({
      selection: { type: "tile", position, zLevel },
    });

    // Dispatch action
    commandRegistry.dispatch("selection.tile", {
      position,
      zLevel,
      tile,
    });
  },

  selectEntity: (entityType, entityId, position) => {
    set({
      selection: { type: "entity", entityType, entityId, position },
    });

    // Dispatch action
    commandRegistry.dispatch("selection.entity", {
      entityType,
      entityId,
      position,
    });
  },

  clearSelection: () => {
    const { selection } = get();
    if (selection.type === "none") return;

    set({ selection: { type: "none" } });

    // Dispatch action
    commandRegistry.dispatch("selection.cleared");
  },

  // ===========================================================================
  // MULTI-SELECTION ACTIONS
  // ===========================================================================

  addToSelection: (entityType: SelectableEntityType, entityId: string) => {
    const { selection } = get();

    if (
      selection.type === "multi-entity" &&
      selection.entityType === entityType
    ) {
      // Add to existing multi-selection
      const newIds = new Set(selection.entityIds);
      newIds.add(entityId);
      set({
        selection: { type: "multi-entity", entityType, entityIds: newIds },
      });
    } else if (
      selection.type === "entity" &&
      selection.entityType === entityType
    ) {
      // Convert single to multi
      const newIds = new Set([selection.entityId, entityId]);
      set({
        selection: { type: "multi-entity", entityType, entityIds: newIds },
      });
    } else {
      // Start new multi-selection (clears any other selection type)
      set({
        selection: {
          type: "multi-entity",
          entityType,
          entityIds: new Set([entityId]),
        },
      });
    }

    commandRegistry.dispatch("selection.changed");
  },

  removeFromSelection: (entityId: string) => {
    const { selection } = get();

    if (selection.type === "multi-entity") {
      const newIds = new Set(selection.entityIds);
      newIds.delete(entityId);

      if (newIds.size === 0) {
        set({ selection: { type: "none" } });
      } else if (newIds.size === 1) {
        // Convert back to single selection
        const [remainingId] = newIds;
        set({
          selection: {
            type: "entity",
            entityType: selection.entityType,
            entityId: remainingId,
          },
        });
      } else {
        set({
          selection: {
            ...selection,
            entityIds: newIds,
          } as MultiEntitySelection,
        });
      }

      commandRegistry.dispatch("selection.changed");
    } else if (selection.type === "entity" && selection.entityId === entityId) {
      set({ selection: { type: "none" } });
      commandRegistry.dispatch("selection.changed");
    }
  },

  toggleSelection: (entityType: SelectableEntityType, entityId: string) => {
    const { selection, addToSelection, removeFromSelection } = get();

    // Check if already selected
    const isCurrentlySelected =
      (selection.type === "entity" && selection.entityId === entityId) ||
      (selection.type === "multi-entity" && selection.entityIds.has(entityId));

    if (isCurrentlySelected) {
      removeFromSelection(entityId);
    } else {
      addToSelection(entityType, entityId);
    }
  },

  selectMultiple: (entityType: SelectableEntityType, entityIds: string[]) => {
    if (entityIds.length === 0) {
      set({ selection: { type: "none" } });
    } else if (entityIds.length === 1) {
      set({
        selection: { type: "entity", entityType, entityId: entityIds[0] },
      });
    } else {
      set({
        selection: {
          type: "multi-entity",
          entityType,
          entityIds: new Set(entityIds),
        },
      });
    }
    commandRegistry.dispatch("selection.changed");
  },

  isSelected: (entityId: string) => {
    const { selection } = get();
    if (selection.type === "entity") {
      return selection.entityId === entityId;
    }
    if (selection.type === "multi-entity") {
      return selection.entityIds.has(entityId);
    }
    return false;
  },

  getSelectedIds: () => {
    const { selection } = get();
    if (selection.type === "entity") {
      return [selection.entityId];
    }
    if (selection.type === "multi-entity") {
      return Array.from(selection.entityIds);
    }
    return [];
  },

  // ===========================================================================
  // INTERACTION ACTIONS
  // ===========================================================================

  setInteractionMode: (mode: InteractionMode) => {
    const { interactionMode: previousMode } = get();
    if (mode === previousMode) return;

    set({ interactionMode: mode });

    // Dispatch action
    commandRegistry.dispatch("interaction.modeChanged", {
      previousMode,
      currentMode: mode,
    });
  },

  setHoverPosition: (position: Position2D | null) => {
    const { hoverPosition: currentHover, currentZLevel } = get();

    // Avoid unnecessary updates
    if (position?.x === currentHover?.x && position?.y === currentHover?.y) {
      return;
    }

    set({ hoverPosition: position });

    // Dispatch action
    commandRegistry.dispatch("interaction.hoverChanged", {
      position,
      zLevel: currentZLevel,
    });
  },

  // ===========================================================================
  // INITIALIZATION ACTIONS
  // ===========================================================================

  initialize: () => {
    set({ isInitialized: true });
  },

  reset: () => {
    entityStore.clear();
    simulationLoop.stop();
    simulationLoop.reset();
    set({
      ...initialState,
      simulation: {
        ...initialSimulationState,
        characters: new Map(),
      },
    });
  },

  // ===========================================================================
  // SIMULATION ACTIONS
  // ===========================================================================

  play: () => {
    logger.info("Starting simulation", ["simulation"]);
    simulationLoop.start();
    set((state) => ({
      simulation: { ...state.simulation, isPlaying: true },
    }));
  },

  pause: () => {
    logger.info("Pausing simulation", ["simulation"]);
    simulationLoop.stop();
    set((state) => ({
      simulation: { ...state.simulation, isPlaying: false },
    }));
  },

  togglePlayPause: () => {
    const { simulation } = get();
    if (simulation.isPlaying) {
      get().pause();
    } else {
      get().play();
    }
  },

  setSpeed: (speed: SimulationSpeed) => {
    logger.info(`Simulation speed changed to ${speed}x`, ["simulation"]);
    simulationLoop.setSpeed(speed);
    set((state) => ({
      simulation: { ...state.simulation, speed },
    }));
  },

  // ===========================================================================
  // CHARACTER MANAGEMENT
  // ===========================================================================

  addCharacter: (character: Character) => {
    entityStore.add(character);
    set((state) => {
      const newCharacters = new Map(state.simulation.characters);
      newCharacters.set(character.id, character);
      return {
        simulation: { ...state.simulation, characters: newCharacters },
      };
    });
  },

  removeCharacter: (id: EntityId) => {
    entityStore.remove(id);
    set((state) => {
      const newCharacters = new Map(state.simulation.characters);
      newCharacters.delete(id);
      return {
        simulation: { ...state.simulation, characters: newCharacters },
      };
    });
  },

  updateCharacter: (id: EntityId, changes: Partial<Character>) => {
    entityStore.update(id, changes);
    const updated = entityStore.get(id);
    if (updated) {
      set((state) => {
        const newCharacters = new Map(state.simulation.characters);
        newCharacters.set(id, updated);
        return {
          simulation: { ...state.simulation, characters: newCharacters },
        };
      });
    }
  },

  getCharacter: (id: EntityId) => {
    return entityStore.get(id);
  },

  getCharactersAtTile: (position: Position3D) => {
    return entityStore.getAtTile(position);
  },

  // ===========================================================================
  // COMMAND MANAGEMENT
  // ===========================================================================

  issueCommand: (characterId: EntityId, command: Command) => {
    logger.debug(`Issuing ${command.type} command to ${characterId}`, [
      "commands",
    ]);

    const character = entityStore.get(characterId);
    if (!character) {
      logger.warn(`Character ${characterId} not found`, ["commands"]);
      return;
    }

    const { world, currentZLevel } = get();
    if (!world) {
      logger.warn("Cannot issue command: world not initialized", ["commands"]);
      return;
    }

    const level = world.levels.get(currentZLevel);
    if (!level) {
      logger.warn(`Level not found for z: ${currentZLevel}`, ["commands"]);
      return;
    }

    if (command.type === "move") {
      const moveCmd = command as MoveCommand;

      // Compute path if not already provided
      if (!moveCmd.path) {
        const start: Position3D = { ...character.position };
        const goal: Position3D = { ...moveCmd.destination, z: currentZLevel };
        const result = findPath(level, start, goal);

        if (!result.found) {
          logger.warn(
            `No path found for ${character.name} to (${goal.x},${goal.y})`,
            ["pathfinding"],
          );
          return;
        }

        logger.debug(
          `Path found: ${result.path.length} waypoints, ${result.nodesExplored} nodes in ${result.timeMs.toFixed(1)}ms`,
          ["pathfinding"],
        );
        moveCmd.path = result.path;
      }

      // Issue move via movement system
      movementSystem.issueMove(characterId, moveCmd);

      // Update state
      const updated = entityStore.get(characterId);
      if (updated) {
        set((state) => {
          const newCharacters = new Map(state.simulation.characters);
          newCharacters.set(characterId, updated);
          return {
            simulation: { ...state.simulation, characters: newCharacters },
          };
        });
      }
    }
  },

  cancelCommand: (characterId: EntityId) => {
    movementSystem.cancelMove(characterId);
    const updated = entityStore.get(characterId);
    if (updated) {
      set((state) => {
        const newCharacters = new Map(state.simulation.characters);
        newCharacters.set(characterId, updated);
        return {
          simulation: { ...state.simulation, characters: newCharacters },
        };
      });
    }
  },

  // ===========================================================================
  // JOB MANAGEMENT
  // ===========================================================================

  assignJob: (job: Job) => {
    jobProcessor.assignJob(job);
  },

  cancelJob: (characterId: EntityId) => {
    jobProcessor.cancelJob(characterId);
  },
}));

// =============================================================================
// JOB PROCESSOR SETUP
// =============================================================================

const jobProcessor = new JobProcessor(
  entityStore,
  movementSystem,
  () => useGameStore.getState().world,
  (position, zLevel, changes) =>
    useGameStore.getState().updateTile(position, zLevel, changes),
);

// =============================================================================
// SIMULATION LOOP SETUP
// =============================================================================

// Set up tick callback to update jobs and movement
simulationLoop.setTickCallback((deltaTime, tick) => {
  // Update job processor (advances work steps, initiates moves)
  jobProcessor.update(deltaTime);

  // Update movement system (advances characters along paths)
  movementSystem.update(deltaTime);

  // Sync entity store and job progress to game state
  const characters = new Map<EntityId, Character>();
  for (const [id, character] of entityStore) {
    characters.set(id, character);
  }
  const jobProgress = jobProcessor.getActiveJobProgress();

  useGameStore.setState((state) => ({
    simulation: {
      ...state.simulation,
      currentTick: tick,
      characters,
      jobProgress,
    },
  }));
});
