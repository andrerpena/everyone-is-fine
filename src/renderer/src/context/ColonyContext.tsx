import {
  createContext,
  type FC,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { commandRegistry } from "../commands";
import {
  characterFocus,
  characterMoveTo,
  characterSelect,
  layerSetVisibility,
  layerToggleVisibility,
  widgetOpenInModal,
  workbenchRunCommand,
  workbenchSetTheme,
  worldSetZoom,
} from "../commands/definitions";
import type { Keybinding } from "../commands/types";
import {
  ModalProvider,
  ModalRenderer,
  useModal,
} from "../components/floating/modal";
import { useConfigStore } from "../config/config-store";
import { COMMAND_IDS } from "../config/registry-ids";
import { useGameStore } from "../game-state";
import { keybindingManager } from "../keybindings/KeybindingManager";
import { logger } from "../lib/logger";
import { viewportStore } from "../lib/viewport-simple";
import type { Command, EntityId } from "../simulation/types";
import { setNestedValue, splitThemeOverrides } from "../theming/color-utils";
import { useGameColorStore } from "../theming/game-color-store";
import {
  clearUIColorOverrides,
  injectThemeVariables,
  injectUIColorOverrides,
} from "../theming/runtime-theme-generator";
import { type AvailableThemeId, themeMap } from "../theming/themes";
import type { Position3D } from "../world/types";
import type {
  ColonyContextData,
  GameContextData,
  ThemingContextData,
} from "./types";

// Create the context
const ColonyContext = createContext<ColonyContextData | null>(null);

// Internal provider that has access to useModal
const ColonyContextInner: FC<{ children: ReactNode }> = ({ children }) => {
  const modal = useModal();
  const [activeThemeId, setActiveThemeIdState] =
    useState<AvailableThemeId>("dark");

  // Set active theme and update DOM
  const setActiveThemeId = useCallback((themeId: AvailableThemeId) => {
    logger.debug(`Theme changed to: ${themeId}`, ["theme"]);
    setActiveThemeIdState(themeId);
    // Update the data-theme attribute on the document element
    document.documentElement.setAttribute("data-theme", themeId);
  }, []);

  // Create theming context data
  const theming: ThemingContextData = useMemo(
    () => ({
      activeThemeId,
      setActiveThemeId,
      themeMap,
    }),
    [activeThemeId, setActiveThemeId],
  );

  // Create game context data
  const game: GameContextData = useMemo(
    () => ({
      // Selection
      selectCharacter: (characterId: EntityId) => {
        const state = useGameStore.getState();
        const character = state.simulation.characters.get(characterId);
        if (character) {
          state.selectEntity("colonist", characterId, {
            x: character.position.x,
            y: character.position.y,
          });
        }
      },
      getSelectedCharacter: () => {
        const state = useGameStore.getState();
        if (
          state.selection.type === "entity" &&
          state.selection.entityType === "colonist"
        ) {
          return (
            state.simulation.characters.get(state.selection.entityId) ?? null
          );
        }
        return null;
      },
      clearSelection: () => useGameStore.getState().clearSelection(),

      // Characters
      getCharacters: () =>
        Array.from(useGameStore.getState().simulation.characters.values()),
      getCharacter: (id: EntityId) =>
        useGameStore.getState().simulation.characters.get(id),

      // Character commands
      issueCharacterCommand: (characterId: EntityId, command: Command) => {
        useGameStore.getState().issueCommand(characterId, command);
      },
      cancelCharacterCommand: (characterId: EntityId) => {
        useGameStore.getState().cancelCommand(characterId);
      },

      // Tile queries
      isTilePassable: (position: Position3D) => {
        const state = useGameStore.getState();
        const world = state.world;
        if (!world) return false;
        const level = world.levels.get(position.z);
        if (!level) return false;
        // Flat array indexed as: tiles[y * width + x]
        const index = position.y * level.width + position.x;
        const tile = level.tiles[index];
        return tile?.pathfinding?.isPassable ?? false;
      },

      // Viewport
      focusCharacter: (characterId: EntityId) => {
        const state = useGameStore.getState();
        const character = state.simulation.characters.get(characterId);
        if (character) {
          // Convert tile position to world pixel position (center of tile)
          // CELL_SIZE is 32, but we use a constant here to avoid circular dependency
          const cellSize = 32;
          const worldX = character.position.x * cellSize + cellSize / 2;
          const worldY = character.position.y * cellSize + cellSize / 2;
          viewportStore.panTo(worldX, worldY);
        }
      },
      setZoom: (scale: number) => {
        viewportStore.setZoom(scale);
      },
      getZoom: () => {
        return viewportStore.getZoom();
      },
    }),
    [],
  );

  // Create the context data
  const contextData: ColonyContextData = useMemo(
    () => ({
      commands: commandRegistry,
      modal,
      theming,
      game,
    }),
    [modal, theming, game],
  );

  // Initialize theming on mount
  useEffect(() => {
    // Inject all theme CSS variables
    const themes = Object.values(themeMap);
    injectThemeVariables(themes);

    // Set initial theme
    document.documentElement.setAttribute("data-theme", activeThemeId);

    // Resolve theme overrides (both game colors and UI colors)
    const resolveTheme = () => {
      const theme = themeMap[activeThemeId];
      const allOverrides = useConfigStore.getState().get("theme");
      const { uiOverrides, gameOverrides } = splitThemeOverrides(
        allOverrides &&
          typeof allOverrides === "object" &&
          !Array.isArray(allOverrides)
          ? (allOverrides as Record<string, string>)
          : {},
      );

      // Game colors: deep-merge overrides into theme defaults, resolve for Pixi
      const baseGameColors = structuredClone(theme.gameColors);
      for (const [path, value] of Object.entries(gameOverrides)) {
        setNestedValue(
          baseGameColors as unknown as Record<string, unknown>,
          path,
          value,
        );
      }
      useGameColorStore.getState().resolve(baseGameColors);

      // UI colors: inject CSS variable overrides
      injectUIColorOverrides(activeThemeId, uiOverrides);
    };
    resolveTheme();

    // Subscribe to config changes for live updates
    const unsub = useConfigStore.subscribe((state, prev) => {
      if (state.computed.theme !== prev.computed.theme) {
        resolveTheme();
      }
    });
    return () => {
      unsub();
      clearUIColorOverrides();
    };
  }, [activeThemeId]);

  // Register commands on mount
  useEffect(() => {
    // Clear any existing commands
    commandRegistry.clear();

    // Register workbench commands
    commandRegistry.register(workbenchRunCommand);
    commandRegistry.register(workbenchSetTheme);

    // Register character commands
    commandRegistry.register(characterSelect);
    commandRegistry.register(characterMoveTo);
    commandRegistry.register(characterFocus);

    // Register world commands
    commandRegistry.register(worldSetZoom);

    // Register layer commands
    commandRegistry.register(layerToggleVisibility);
    commandRegistry.register(layerSetVisibility);

    // Register widget commands
    commandRegistry.register(widgetOpenInModal);

    // Set the context for the command registry
    commandRegistry.setContext(contextData);

    // Dev-time check: warn if registered commands don't match COMMAND_IDS
    if (import.meta.env.DEV) {
      const registered = new Set(
        commandRegistry.getAllCommands().map((c) => c.id),
      );
      const declared = new Set<string>(COMMAND_IDS);
      for (const id of registered) {
        if (!declared.has(id)) {
          logger.warn(
            `Command "${id}" is registered but missing from COMMAND_IDS in registry-ids.ts`,
            ["commands"],
          );
        }
      }
    }

    // Resolve keybindings from config (defaults + user overrides)
    const resolveKeybindings = (): Keybinding[] => {
      const value = useConfigStore.getState().get("keybindings");
      if (!Array.isArray(value)) return [];
      return (value as Record<string, unknown>[]).map((entry) => ({
        key: entry.key as string | string[],
        command: entry.command as string,
        ...(entry.args
          ? { payload: entry.args as Record<string, unknown> }
          : {}),
      }));
    };

    keybindingManager.registerKeybindings(resolveKeybindings());

    // Subscribe to config changes for live keybinding updates
    const unsub = useConfigStore.subscribe((state, prev) => {
      if (state.computed.keybindings !== prev.computed.keybindings) {
        keybindingManager.registerKeybindings(resolveKeybindings());
      }
    });

    return () => {
      unsub();
    };
  }, [contextData]);

  return (
    <ColonyContext.Provider value={contextData}>
      {children}
      <ModalRenderer />
    </ColonyContext.Provider>
  );
};

// Main provider component that wraps ModalProvider
export const ColonyProvider: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ModalProvider>
      <ColonyContextInner>{children}</ColonyContextInner>
    </ModalProvider>
  );
};

// Hook to use the Colony context
export const useColony = (): ColonyContextData => {
  const context = useContext(ColonyContext);
  if (!context) {
    throw new Error("useColony must be used within a ColonyProvider");
  }
  return context;
};
