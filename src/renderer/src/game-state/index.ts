// =============================================================================
// PUBLIC GAME STATE EXPORTS
// =============================================================================

// Interaction hooks
export {
  useHoverPosition,
  useInteractionActions,
  useInteractionMode,
  useIsInteractionMode,
} from "./hooks/useInteraction";

// Selection hooks
export {
  useHasSelection,
  useIsEntitySelected,
  useMultiSelectionActions,
  useSelectedEntity,
  useSelectedEntityIds,
  useSelectedTile,
  useSelectedTileData,
  useSelection,
  useSelectionActions,
  useSelectionType,
} from "./hooks/useSelection";
// Simulation hooks
export {
  useCharacter,
  useCharacterActions,
  useCharacterCount,
  useCharacters,
  useCharactersArray,
  useCommandActions,
  useCurrentTick,
  useIsCharacterSelected,
  useIsPlaying,
  useMoveCommand,
  useSelectedCharacter,
  useSimulation,
  useSimulationSpeed,
  useSimulationState,
  useTimeControls,
} from "./hooks/useSimulation";
// World hooks
export {
  useCurrentLevel,
  useCurrentZLevel,
  useIsWorldInitialized,
  useLevel,
  useTileAt,
  useWorld,
  useWorldActions,
  useWorldConfig,
  useWorldDimensions,
  useWorldMetadata,
} from "./hooks/useWorld";

// Store
export { useGameStore } from "./store";
// Types
export type {
  EntitySelection,
  GameState,
  GameStateActions,
  GameStore,
  InteractionMode,
  MultiEntitySelection,
  NoSelection,
  SelectableEntityType,
  SelectedStructureInfo,
  SelectedTileInfo,
  Selection,
  SimulationStateActions,
  SimulationStateSlice,
  TileSelection,
  WorldGenerationConfig,
} from "./types";
// Utils
export { getSelectedColonistIds } from "./utils";
