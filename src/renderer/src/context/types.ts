import type { CommandRegistry } from "../commands/types";
import type { UseModalResult } from "../components/floating/modal";
import type { Character, Command, EntityId } from "../simulation/types";
import type { AvailableThemeId, themeMap } from "../theming/themes";
import type { Position3D } from "../world/types";

export interface ThemingContextData {
  activeThemeId: AvailableThemeId;
  setActiveThemeId: (themeId: AvailableThemeId) => void;
  themeMap: typeof themeMap;
}

export interface GameContextData {
  // Selection
  selectCharacter: (characterId: EntityId) => void;
  getSelectedCharacter: () => Character | null;
  clearSelection: () => void;

  // Characters
  getCharacters: () => Character[];
  getCharacter: (characterId: EntityId) => Character | undefined;

  // Character commands
  issueCharacterCommand: (characterId: EntityId, command: Command) => void;
  cancelCharacterCommand: (characterId: EntityId) => void;

  // Tile queries
  isTilePassable: (position: Position3D) => boolean;

  // Viewport
  focusCharacter: (characterId: EntityId) => void;
  setZoom: (scale: number) => void;
  getZoom: () => number;
}

export interface ColonyContextData {
  /** Unified command registry for commands and events */
  commands: CommandRegistry;
  modal: UseModalResult;
  theming: ThemingContextData;
  game: GameContextData;
}
