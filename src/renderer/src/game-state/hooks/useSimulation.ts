// =============================================================================
// SIMULATION HOOKS
// =============================================================================

import { useCallback, useMemo } from "react";
import type {
  Character,
  Command,
  EntityId,
  SimulationSpeed,
} from "../../simulation/types";
import type { Position3D } from "../../world/types";
import { useGameStore } from "../store";

// =============================================================================
// TIME CONTROL HOOKS
// =============================================================================

/** Get whether simulation is playing */
export function useIsPlaying(): boolean {
  return useGameStore((state) => state.simulation.isPlaying);
}

/** Get current simulation speed */
export function useSimulationSpeed(): SimulationSpeed {
  return useGameStore((state) => state.simulation.speed);
}

/** Get current simulation tick */
export function useCurrentTick(): number {
  return useGameStore((state) => state.simulation.currentTick);
}

/** Get simulation state (isPlaying, speed, currentTick) */
export function useSimulationState() {
  return useGameStore((state) => ({
    isPlaying: state.simulation.isPlaying,
    speed: state.simulation.speed,
    currentTick: state.simulation.currentTick,
  }));
}

/** Get time control actions */
export function useTimeControls() {
  const play = useGameStore((state) => state.play);
  const pause = useGameStore((state) => state.pause);
  const togglePlayPause = useGameStore((state) => state.togglePlayPause);
  const setSpeed = useGameStore((state) => state.setSpeed);

  return useMemo(
    () => ({
      play,
      pause,
      togglePlayPause,
      setSpeed,
    }),
    [play, pause, togglePlayPause, setSpeed],
  );
}

// =============================================================================
// CHARACTER HOOKS
// =============================================================================

/** Get all characters */
export function useCharacters(): Map<EntityId, Character> {
  return useGameStore((state) => state.simulation.characters);
}

/** Get characters as an array */
export function useCharactersArray(): Character[] {
  const characters = useGameStore((state) => state.simulation.characters);
  return useMemo(() => Array.from(characters.values()), [characters]);
}

/** Get a specific character by ID */
export function useCharacter(id: EntityId): Character | undefined {
  return useGameStore((state) => state.simulation.characters.get(id));
}

/** Get character count */
export function useCharacterCount(): number {
  return useGameStore((state) => state.simulation.characters.size);
}

/** Check if a character is selected */
export function useIsCharacterSelected(id: EntityId): boolean {
  return useGameStore((state) => {
    const { selection } = state;
    return (
      selection.type === "entity" &&
      selection.entityType === "colonist" &&
      selection.entityId === id
    );
  });
}

/** Get the currently selected character (if any) */
export function useSelectedCharacter(): Character | null {
  return useGameStore((state) => {
    const { selection, simulation } = state;
    if (selection.type !== "entity" || selection.entityType !== "colonist") {
      return null;
    }
    return simulation.characters.get(selection.entityId) ?? null;
  });
}

// =============================================================================
// CHARACTER ACTION HOOKS
// =============================================================================

/** Get character management actions */
export function useCharacterActions() {
  const addCharacter = useGameStore((state) => state.addCharacter);
  const removeCharacter = useGameStore((state) => state.removeCharacter);
  const updateCharacter = useGameStore((state) => state.updateCharacter);
  const getCharacter = useGameStore((state) => state.getCharacter);
  const getCharactersAtTile = useGameStore(
    (state) => state.getCharactersAtTile,
  );

  return useMemo(
    () => ({
      addCharacter,
      removeCharacter,
      updateCharacter,
      getCharacter,
      getCharactersAtTile,
    }),
    [
      addCharacter,
      removeCharacter,
      updateCharacter,
      getCharacter,
      getCharactersAtTile,
    ],
  );
}

// =============================================================================
// COMMAND HOOKS
// =============================================================================

/** Get command actions */
export function useCommandActions() {
  const issueCommand = useGameStore((state) => state.issueCommand);
  const cancelCommand = useGameStore((state) => state.cancelCommand);

  return useMemo(
    () => ({
      issueCommand,
      cancelCommand,
    }),
    [issueCommand, cancelCommand],
  );
}

/** Issue a move command to a character */
export function useMoveCommand() {
  const issueCommand = useGameStore((state) => state.issueCommand);

  return useCallback(
    (characterId: EntityId, destination: Position3D) => {
      const command: Command = {
        id: `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type: "move",
        priority: 5,
        assignedTo: characterId,
        status: "pending",
        createdAt: Date.now(),
        destination,
      };
      issueCommand(characterId, command);
    },
    [issueCommand],
  );
}

// =============================================================================
// COMBINED SIMULATION HOOKS
// =============================================================================

/** Get all simulation state and actions */
export function useSimulation() {
  const state = useSimulationState();
  const timeControls = useTimeControls();
  const characterActions = useCharacterActions();
  const commandActions = useCommandActions();
  const characters = useCharactersArray();

  return useMemo(
    () => ({
      ...state,
      ...timeControls,
      ...characterActions,
      ...commandActions,
      characters,
    }),
    [state, timeControls, characterActions, commandActions, characters],
  );
}
