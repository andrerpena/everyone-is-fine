import { commandRegistry } from "@renderer/commands";
import { useConfigStore } from "@renderer/config";
import { logger } from "@renderer/lib/logger";
import { PaletteTextureManager } from "@renderer/lib/palette-texture-manager";
import { usePerformanceStore } from "@renderer/lib/performance-store";
import { SimpleViewport, viewportStore } from "@renderer/lib/viewport-simple";
import type {
  ItemType,
  StructureType,
  TerrainType,
  Tile,
  World as WorldData,
  ZLevel,
} from "@renderer/world/types";
import {
  Application,
  Container,
  Graphics,
  Sprite,
  Text,
  type Texture,
} from "pixi.js";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import "pixi.js/unsafe-eval";
import { getSelectedColonistIds, useGameStore } from "@renderer/game-state";
import { usePixiInteraction } from "@renderer/interaction";
import { useLayerStore } from "@renderer/layers";
import type { JobProgressInfo } from "@renderer/simulation/jobs/types";
import type { EntityId } from "@renderer/simulation/types";
import {
  type ResolvedGameColors,
  useGameColorStore,
} from "@renderer/theming/game-color-store";
import type { Position2D } from "@renderer/world/types";
import {
  CharacterRenderer,
  HeatMapRenderer,
  JobProgressRenderer,
  PathRenderer,
} from "./renderers";

// =============================================================================
// CONFIGURATION
// =============================================================================

export const CELL_SIZE = 32; // Pixels per cell - exported for interaction system

// Singleton palette texture manager — handles color replacement for all sprites
const paletteTextureManager = new PaletteTextureManager();

// =============================================================================
// TERRAIN SPRITES
// =============================================================================

/** Sprite paths for terrain types */
const TERRAIN_SPRITE_PATHS: Record<TerrainType, string> = {
  soil: "/sprites/terrain/soil/soil.png",
  sand: "/sprites/terrain/sand/sand.png",
  clay: "/sprites/terrain/clay/clay.png",
  gravel: "/sprites/terrain/gravel/gravel.png",
  rock: "/sprites/terrain/rock/rock.png",
  granite: "/sprites/terrain/granite/granite.png",
  limestone: "/sprites/terrain/limestone/limestone.png",
  marble: "/sprites/terrain/marble/marble.png",
  obsidian: "/sprites/terrain/obsidian/obsidian.png",
  water_shallow: "/sprites/terrain/water_shallow/water_shallow.png",
  water_deep: "/sprites/terrain/water_deep/water_deep.png",
  lava: "/sprites/terrain/lava/lava.png",
  void: "/sprites/terrain/void/void.png",
};

/** Cached terrain textures */
const terrainTextures: Map<TerrainType, Texture> = new Map();

/** Preload all terrain textures */
async function preloadTerrainTextures(): Promise<void> {
  if (terrainTextures.size > 0) return; // Already loaded

  const terrainTypes = Object.keys(TERRAIN_SPRITE_PATHS) as TerrainType[];

  for (const terrainType of terrainTypes) {
    try {
      const texture = await paletteTextureManager.loadTexture(
        TERRAIN_SPRITE_PATHS[terrainType],
      );
      terrainTextures.set(terrainType, texture);
    } catch (error) {
      logger.error(
        `Failed to load terrain texture for ${terrainType}: ${String(error)}`,
        ["pixi"],
      );
    }
  }

  logger.info(
    `Loaded ${terrainTextures.size}/${terrainTypes.length} terrain textures`,
    ["pixi"],
  );
}

// =============================================================================
// STRUCTURE SPRITES
// =============================================================================

/** Structure types that have sprite textures */
type SpriteStructureType = "tree_oak" | "tree_pine" | "bush" | "boulder";

/** Sprite paths for structure types that use sprites */
const STRUCTURE_SPRITE_PATHS: Record<SpriteStructureType, string> = {
  tree_oak: "/sprites/structures/tree_oak/tree_oak.png",
  tree_pine: "/sprites/structures/tree_pine/tree_pine.png",
  bush: "/sprites/structures/bush/bush.png",
  boulder: "/sprites/structures/boulder/boulder.png",
};

/** Cached structure textures */
const structureTextures: Map<SpriteStructureType, Texture> = new Map();

/** Check if a structure type has a sprite */
function hasStructureSprite(type: StructureType): type is SpriteStructureType {
  return type in STRUCTURE_SPRITE_PATHS;
}

/** Preload all structure textures */
async function preloadStructureTextures(): Promise<void> {
  if (structureTextures.size > 0) return; // Already loaded

  const structureTypes = Object.keys(
    STRUCTURE_SPRITE_PATHS,
  ) as SpriteStructureType[];

  for (const structureType of structureTypes) {
    try {
      const texture = await paletteTextureManager.loadTexture(
        STRUCTURE_SPRITE_PATHS[structureType],
      );
      structureTextures.set(structureType, texture);
    } catch (error) {
      logger.error(
        `Failed to load structure texture for ${structureType}: ${String(error)}`,
        ["pixi"],
      );
    }
  }

  logger.info(
    `Loaded ${structureTextures.size}/${structureTypes.length} structure textures`,
    ["pixi"],
  );
}

// =============================================================================
// ITEM SPRITES
// =============================================================================

/** Item types that have sprite textures */
type SpriteItemType =
  | "wood"
  | "stone"
  | "iron"
  | "gold"
  | "silver"
  | "coal"
  | "cloth"
  | "leather"
  | "meat"
  | "berries";

/** Sprite paths for item types that use sprites */
const ITEM_SPRITE_PATHS: Record<SpriteItemType, string> = {
  wood: "/sprites/resources/wood/wood.png",
  stone: "/sprites/resources/stone/stone.png",
  iron: "/sprites/resources/iron/iron.png",
  gold: "/sprites/resources/gold/gold.png",
  silver: "/sprites/resources/silver/silver.png",
  coal: "/sprites/resources/coal/coal.png",
  cloth: "/sprites/resources/cloth/cloth.png",
  leather: "/sprites/resources/leather/leather.png",
  meat: "/sprites/resources/meat/meat.png",
  berries: "/sprites/resources/berries/berries.png",
};

/** Cached item textures */
const itemTextures: Map<SpriteItemType, Texture> = new Map();

/** Check if an item type has a sprite */
function hasItemSprite(type: ItemType): type is SpriteItemType {
  return type in ITEM_SPRITE_PATHS;
}

/** Preload all item textures */
async function preloadItemTextures(): Promise<void> {
  if (itemTextures.size > 0) return; // Already loaded

  const itemTypes = Object.keys(ITEM_SPRITE_PATHS) as SpriteItemType[];

  for (const itemType of itemTypes) {
    try {
      const texture = await paletteTextureManager.loadTexture(
        ITEM_SPRITE_PATHS[itemType],
      );
      itemTextures.set(itemType, texture);
    } catch (error) {
      logger.error(
        `Failed to load item texture for ${itemType}: ${String(error)}`,
        ["pixi"],
      );
    }
  }

  logger.info(`Loaded ${itemTextures.size}/${itemTypes.length} item textures`, [
    "pixi",
  ]);
}

// =============================================================================
// COMPONENT
// =============================================================================

interface WorldProps {
  /** World to display */
  world: WorldData;
  /** Current z-level to display */
  zLevel: number;
}

const World: React.FC<WorldProps> = ({ world, zLevel }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const viewportRef = useRef<SimpleViewport | null>(null);
  const isInitializedRef = useRef(false);

  // Overlay graphics for selection and hover
  const selectionGraphicsRef = useRef<Graphics | null>(null);
  const hoverGraphicsRef = useRef<Graphics | null>(null);

  // Feature layer graphics refs for visibility toggling (O(1) performance)
  const terrainContainerRef = useRef<Container | null>(null);
  const treesContainerRef = useRef<Container | null>(null);
  const structuresGraphicsRef = useRef<Graphics | null>(null);
  const itemsGraphicsRef = useRef<Graphics | null>(null);

  // Per-tile display object tracking for reactive tile updates
  const treeSpritesRef = useRef<Map<string, Sprite>>(new Map());
  const itemDisplaysRef = useRef<Map<string, Sprite>>(new Map());
  const tileUpdateUnsubRef = useRef<(() => void) | null>(null);

  // Character, path, heat map, and job progress renderers
  const characterRendererRef = useRef<CharacterRenderer | null>(null);
  const pathRendererRef = useRef<PathRenderer | null>(null);
  const heatMapRendererRef = useRef<HeatMapRenderer | null>(null);
  const jobProgressRendererRef = useRef<JobProgressRenderer | null>(null);

  // Interaction container for click handling
  const [interactionContainer, setInteractionContainer] =
    useState<Container | null>(null);

  // Wire up interaction system
  usePixiInteraction({
    container: interactionContainer,
    world,
    zLevel,
    cellSize: CELL_SIZE,
  });

  const level = world.levels.get(zLevel);

  // Subscribe to selection, hover, character, and layer state changes
  useEffect(() => {
    // Helper to update character, path, and job progress renderers
    const updateCharacterAndPath = (
      characters: Map<string, import("@renderer/simulation/types").Character>,
      selection: ReturnType<typeof useGameStore.getState>["selection"],
      shouldRenderCharacters: boolean,
      jobProgress?: Map<EntityId, JobProgressInfo>,
    ) => {
      const selectedIds = new Set(getSelectedColonistIds(selection));

      if (characterRendererRef.current) {
        if (shouldRenderCharacters) {
          characterRendererRef.current.update(
            characters,
            selectedIds,
            zLevel,
            jobProgress,
          );
        } else {
          characterRendererRef.current.update(new Map(), new Set(), zLevel);
        }
      }

      if (pathRendererRef.current) {
        // For path rendering, show path for first selected character (or none if multiple)
        const selectedCharacter =
          selectedIds.size === 1 && shouldRenderCharacters
            ? characters.get([...selectedIds][0])
            : null;
        pathRendererRef.current.update(selectedCharacter ?? null);
      }

      if (jobProgressRendererRef.current && jobProgress) {
        jobProgressRendererRef.current.update(jobProgress);
      }
    };

    const unsubscribeGame = useGameStore.subscribe((state) => {
      const currentColors = useGameColorStore.getState().resolved;

      // Update selection overlay
      if (selectionGraphicsRef.current) {
        updateSelectionOverlay(
          selectionGraphicsRef.current,
          state.selection.type === "tile" ? state.selection.position : null,
          state.selection.type === "tile" ? state.selection.zLevel : null,
          zLevel,
          currentColors.selection.highlight,
        );
      }

      // Update hover overlay
      if (hoverGraphicsRef.current) {
        updateHoverOverlay(
          hoverGraphicsRef.current,
          state.hoverPosition,
          currentColors.selection.hoverFill,
        );
      }

      // Update characters, paths, and job progress
      const layerVisibility = useLayerStore.getState().visibility;
      const shouldRenderCharacters = layerVisibility.get("characters") ?? true;
      updateCharacterAndPath(
        state.simulation.characters,
        state.selection,
        shouldRenderCharacters,
        state.simulation.jobProgress,
      );
    });

    const unsubscribeLayers = useLayerStore.subscribe((state) => {
      // Update heat map renderer
      if (heatMapRendererRef.current && level) {
        heatMapRendererRef.current.update(level, state.visibility);
      }

      // Toggle feature layer visibility (O(1) - just setting .visible property)
      if (treesContainerRef.current) {
        treesContainerRef.current.visible =
          state.visibility.get("trees") ?? true;
      }
      if (structuresGraphicsRef.current) {
        structuresGraphicsRef.current.visible =
          state.visibility.get("structures") ?? true;
      }
      if (itemsGraphicsRef.current) {
        itemsGraphicsRef.current.visible =
          state.visibility.get("items") ?? true;
      }

      // Update characters and paths based on visibility
      const gameState = useGameStore.getState();
      const shouldRenderCharacters = state.visibility.get("characters") ?? true;
      updateCharacterAndPath(
        gameState.simulation.characters,
        gameState.selection,
        shouldRenderCharacters,
        gameState.simulation.jobProgress,
      );
    });

    return () => {
      unsubscribeGame();
      unsubscribeLayers();
    };
  }, [zLevel, level]);

  // World pixel size for centering
  const worldPixelWidth = (level?.width ?? 64) * CELL_SIZE;
  const worldPixelHeight = (level?.height ?? 64) * CELL_SIZE;

  useEffect(() => {
    if (!containerRef.current || isInitializedRef.current) return;

    let isActive = true;

    const setup = async () => {
      const container = containerRef.current;
      if (!container || !level) return;

      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // Get initial game colors from the store
      const initialColors = useGameColorStore.getState().resolved;

      const app = new Application();

      await app.init({
        width: rect.width,
        height: rect.height,
        backgroundColor: initialColors.world.background,
        antialias: false, // Pixel-perfect for tiles
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        // Note: We handle resize manually via ResizeObserver + ticker for flicker-free dock panel resizing
      });

      if (!isActive) {
        app.destroy(true, { children: true, texture: true });
        return;
      }

      container.appendChild(app.canvas);
      app.canvas.style.display = "block";

      // Prevent default context menu on right-click
      app.canvas.addEventListener("contextmenu", (e) => {
        e.preventDefault();
      });

      // Apply maxFPS from config
      const maxFramerate = useConfigStore.getState().get("pixi.maxFramerate");
      if (typeof maxFramerate === "number") {
        app.ticker.maxFPS = maxFramerate;
      }

      // Subscribe to config changes for maxFPS
      const unsubscribeConfig = useConfigStore.subscribe((state) => {
        const newMaxFps = state.computed["pixi.maxFramerate"];
        if (typeof newMaxFps === "number" && appRef.current) {
          appRef.current.ticker.maxFPS = newMaxFps;
        }
      });

      // Subscribe to game color changes for live theme updates
      const unsubscribeColors = useGameColorStore.subscribe((state) => {
        const colors = state.resolved;
        if (appRef.current) {
          appRef.current.renderer.background.color = colors.world.background;
        }
        characterRendererRef.current?.updateColors(colors);
        pathRendererRef.current?.updateColors(colors);
        jobProgressRendererRef.current?.updateColors(colors);
      });

      appRef.current = app;
      isInitializedRef.current = true;

      // Create viewport (wheel zooms, drag pans - like Dwarf Fortress/RimWorld)
      const viewport = new SimpleViewport({
        screenWidth: rect.width,
        screenHeight: rect.height,
        minScale: 0.1,
        maxScale: 4,
        zoomSpeed: 0.1,
      });

      app.stage.addChild(viewport);
      viewportRef.current = viewport;

      // Register viewport with store for command access
      viewportStore.setViewport(viewport);

      // Attach wheel zoom and touch pinch handlers
      viewport.attachWheelZoom(app.canvas);

      // Get initial layer visibility
      const initialLayerVisibility = useLayerStore.getState().visibility;

      // Preload textures before rendering (uses palette manager for color replacement)
      await preloadTerrainTextures();
      await preloadStructureTextures();
      await preloadItemTextures();

      // Render the world (terrain and features as separate layers)
      logger.info(`Rendering world tiles (${level.width}x${level.height})`, [
        "pixi",
      ]);
      const {
        terrainContainer,
        treesContainer,
        structuresGraphics,
        itemsGraphics,
        treeSprites,
        itemDisplays,
      } = renderWorld(viewport, level, initialColors);

      // Store refs for visibility toggling
      terrainContainerRef.current = terrainContainer;
      treesContainerRef.current = treesContainer;
      structuresGraphicsRef.current = structuresGraphics;
      itemsGraphicsRef.current = itemsGraphics;

      // Store per-tile sprite tracking refs
      treeSpritesRef.current = treeSprites;
      itemDisplaysRef.current = itemDisplays;

      // Set initial visibility based on layer state
      treesContainer.visible = initialLayerVisibility.get("trees") ?? true;
      structuresGraphics.visible =
        initialLayerVisibility.get("structures") ?? true;
      itemsGraphics.visible = initialLayerVisibility.get("items") ?? true;

      logger.info("Pixi.js viewport initialized", ["pixi"]);

      // Create heat map overlay container (between world and hover)
      const heatMapContainer = new Container();
      viewport.addChild(heatMapContainer);
      const heatMapRenderer = new HeatMapRenderer(heatMapContainer, CELL_SIZE);
      heatMapRendererRef.current = heatMapRenderer;

      // Initial heat map render
      heatMapRenderer.update(level, initialLayerVisibility);

      // Create hover overlay (drawn first, below selection)
      const hoverGraphics = new Graphics();
      viewport.addChild(hoverGraphics);
      hoverGraphicsRef.current = hoverGraphics;

      // Create selection overlay (drawn on top of hover)
      const selectionGraphics = new Graphics();
      viewport.addChild(selectionGraphics);
      selectionGraphicsRef.current = selectionGraphics;

      // Create job progress renderer (drawn below characters)
      const jobProgressContainer = new Container();
      viewport.addChild(jobProgressContainer);
      const jobProgressRenderer = new JobProgressRenderer(
        jobProgressContainer,
        CELL_SIZE,
        initialColors,
      );
      jobProgressRendererRef.current = jobProgressRenderer;

      // Preload character assets and create renderer
      await CharacterRenderer.preloadAssets(paletteTextureManager);
      const characterContainer = new Container();
      viewport.addChild(characterContainer);
      const characterRenderer = new CharacterRenderer(
        characterContainer,
        CELL_SIZE,
        initialColors,
      );
      characterRendererRef.current = characterRenderer;

      // Create path renderer (drawn above characters)
      const pathContainer = new Container();
      viewport.addChild(pathContainer);
      const pathRenderer = new PathRenderer(
        pathContainer,
        CELL_SIZE,
        initialColors,
      );
      pathRendererRef.current = pathRenderer;

      // Initial render of characters (subscription only fires on changes)
      const initialState = useGameStore.getState();
      logger.debug(
        `Initial character render: ${initialState.simulation.characters.size} characters at z=${zLevel}`,
        ["pixi"],
      );
      const initialSelectedIds = new Set(
        getSelectedColonistIds(initialState.selection),
      );
      characterRenderer.update(
        initialState.simulation.characters,
        initialSelectedIds,
        zLevel,
      );

      // Create interaction layer (transparent, covers world area)
      const interactionLayer = new Container();
      interactionLayer.eventMode = "static";
      interactionLayer.hitArea = {
        contains: (x: number, y: number) => {
          return (
            x >= 0 &&
            x < level.width * CELL_SIZE &&
            y >= 0 &&
            y < level.height * CELL_SIZE
          );
        },
      };
      viewport.addChild(interactionLayer);
      setInteractionContainer(interactionLayer);

      // Center on the world
      viewport.panTo(worldPixelWidth / 2, worldPixelHeight / 2);

      // Handle resize when container size changes (e.g., dock panel resize)
      // Queue resize to happen on Pixi's ticker to sync with render loop (prevents flickering)
      let pendingResize = false;

      const handleResize = () => {
        if (!pendingResize) return;
        pendingResize = false;

        const currentApp = appRef.current;
        if (!currentApp || !container) return;

        const { width, height } = container.getBoundingClientRect();
        if (width > 0 && height > 0) {
          // Resize renderer in sync with render loop
          currentApp.renderer.resize(width, height);
          // Update viewport's internal screen dimensions
          if (viewportRef.current) {
            viewportRef.current.resize(width, height);
          }
        }
      };

      // Add resize handler to Pixi's ticker
      app.ticker.add(handleResize);

      // Throttled FPS update callback (updates every 500ms to reduce overhead)
      let lastFpsUpdate = 0;
      const FPS_UPDATE_INTERVAL = 500;
      const fpsCallback = () => {
        const now = performance.now();
        if (now - lastFpsUpdate >= FPS_UPDATE_INTERVAL) {
          lastFpsUpdate = now;
          usePerformanceStore.getState().pushFps(Math.round(app.ticker.FPS));
        }
      };
      app.ticker.add(fpsCallback);

      const resizeObserver = new ResizeObserver(() => {
        // Just flag that resize is needed - actual resize happens on next tick
        pendingResize = true;
      });
      resizeObserver.observe(container);

      // Store references for cleanup
      const appWithExtras = app as Application & {
        _resizeObserver?: ResizeObserver;
        _resizeHandler?: () => void;
        _fpsHandler?: () => void;
        _configUnsubscribe?: () => void;
        _colorsUnsubscribe?: () => void;
      };
      appWithExtras._resizeObserver = resizeObserver;
      appWithExtras._resizeHandler = handleResize;
      appWithExtras._fpsHandler = fpsCallback;
      appWithExtras._configUnsubscribe = unsubscribeConfig;
      appWithExtras._colorsUnsubscribe = unsubscribeColors;

      // Subscribe to tile updates for reactive rendering (tree removal, item spawning)
      tileUpdateUnsubRef.current = commandRegistry.on(
        "world.tileUpdated",
        (payload: unknown) => {
          const {
            position,
            zLevel: tileZ,
            tile,
          } = payload as {
            position: Position2D;
            zLevel: number;
            tile: Tile;
          };
          if (tileZ !== zLevel) return;

          const key = `${position.x},${position.y}`;
          const px = position.x * CELL_SIZE;
          const py = position.y * CELL_SIZE;

          // Handle structure removal (tree chopped, boulder mined)
          const existingTree = treeSpritesRef.current.get(key);
          if (
            existingTree &&
            (!tile.structure || tile.structure.type === "none")
          ) {
            treesContainerRef.current?.removeChild(existingTree);
            existingTree.destroy();
            treeSpritesRef.current.delete(key);
          }

          // Handle item changes
          const existingItem = itemDisplaysRef.current.get(key);
          if (existingItem) {
            itemsGraphicsRef.current?.removeChild(existingItem);
            existingItem.destroy();
            itemDisplaysRef.current.delete(key);
          }

          if (tile.items.length > 0) {
            const firstItem = tile.items[0];
            if (hasItemSprite(firstItem.type)) {
              const texture = itemTextures.get(firstItem.type);
              if (texture && itemsGraphicsRef.current) {
                const sprite = new Sprite(texture);
                sprite.x = px;
                sprite.y = py;
                sprite.width = CELL_SIZE;
                sprite.height = CELL_SIZE;
                itemsGraphicsRef.current.addChild(sprite);
                itemDisplaysRef.current.set(key, sprite);
              }
            }
          }
        },
      );

      // Dispatch world.ready command to notify that viewport is fully initialized
      commandRegistry.dispatch("world.ready", { timestamp: Date.now() });
    };

    setup();

    return () => {
      isActive = false;
      setInteractionContainer(null);
      selectionGraphicsRef.current = null;
      hoverGraphicsRef.current = null;
      // Destroy renderers
      if (characterRendererRef.current) {
        characterRendererRef.current.destroy();
        characterRendererRef.current = null;
      }
      if (pathRendererRef.current) {
        pathRendererRef.current.destroy();
        pathRendererRef.current = null;
      }
      if (heatMapRendererRef.current) {
        heatMapRendererRef.current.destroy();
        heatMapRendererRef.current = null;
      }
      if (jobProgressRendererRef.current) {
        jobProgressRendererRef.current.destroy();
        jobProgressRendererRef.current = null;
      }
      if (appRef.current) {
        const app = appRef.current as Application & {
          _resizeObserver?: ResizeObserver;
          _resizeHandler?: () => void;
          _fpsHandler?: () => void;
          _configUnsubscribe?: () => void;
          _colorsUnsubscribe?: () => void;
        };
        app._resizeObserver?.disconnect();
        if (app._resizeHandler) {
          app.ticker.remove(app._resizeHandler);
        }
        if (app._fpsHandler) {
          app.ticker.remove(app._fpsHandler);
        }
        app._configUnsubscribe?.();
        app._colorsUnsubscribe?.();
      }
      if (viewportRef.current) {
        viewportStore.setViewport(null);
        viewportRef.current.destroy();
        viewportRef.current = null;
      }
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true });
        appRef.current = null;
      }
      tileUpdateUnsubRef.current?.();
      tileUpdateUnsubRef.current = null;
      treeSpritesRef.current.clear();
      itemDisplaysRef.current.clear();
      isInitializedRef.current = false;
    };
  }, [level, worldPixelWidth, worldPixelHeight, zLevel]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        cursor: "grab",
        touchAction: "none", // Handle all touch gestures manually
      }}
    />
  );
};

/** Result of rendering world - separate containers/graphics for each feature layer */
interface RenderWorldResult {
  terrainContainer: Container;
  treesContainer: Container;
  structuresGraphics: Graphics;
  itemsGraphics: Graphics;
  treeSprites: Map<string, Sprite>;
  itemDisplays: Map<string, Sprite>;
}

/** Render the world tiles to the viewport with separate feature layers */
function renderWorld(
  viewport: SimpleViewport,
  level: ZLevel,
  colors: ResolvedGameColors,
): RenderWorldResult {
  // Terrain container for sprites
  const terrainContainer = new Container();

  // Grid overlay graphics (drawn on top of terrain)
  const gridGraphics = new Graphics();

  // Separate containers/graphics for toggleable feature layers (O(1) visibility toggle)
  const treesContainer = new Container();
  const structuresGraphics = new Graphics();
  const itemsGraphics = new Graphics();

  // Per-tile display object tracking for reactive updates
  const treeSprites = new Map<string, Sprite>();
  const itemDisplays = new Map<string, Sprite>();

  // Render tiles
  for (let y = 0; y < level.height; y++) {
    for (let x = 0; x < level.width; x++) {
      const tile = level.tiles[y * level.width + x];
      const px = x * CELL_SIZE;
      const py = y * CELL_SIZE;

      // Draw terrain sprite
      const terrainTexture = terrainTextures.get(tile.terrain.type);
      if (terrainTexture) {
        const sprite = new Sprite(terrainTexture);
        sprite.x = px;
        sprite.y = py;
        sprite.width = CELL_SIZE;
        sprite.height = CELL_SIZE;
        terrainContainer.addChild(sprite);
      }

      // Draw structure overlay if present
      if (tile.structure && tile.structure.type !== "none") {
        const structureColor = colors.structures.pixi[tile.structure.type];
        const structureType = tile.structure.type;

        // Check if this structure type has a sprite
        if (hasStructureSprite(structureType)) {
          // Use sprite for trees and bushes
          const texture = structureTextures.get(structureType);
          if (texture) {
            const sprite = new Sprite(texture);
            sprite.x = px;
            sprite.y = py;
            sprite.width = CELL_SIZE;
            sprite.height = CELL_SIZE;
            treesContainer.addChild(sprite);
            treeSprites.set(`${x},${y}`, sprite);
          }
        } else {
          // Draw other structures as full tiles
          structuresGraphics.rect(px, py, CELL_SIZE, CELL_SIZE);
          structuresGraphics.fill(structureColor);
        }
      }

      // Draw items on the ground
      if (tile.items.length > 0) {
        const firstItem = tile.items[0];
        if (hasItemSprite(firstItem.type)) {
          const texture = itemTextures.get(firstItem.type);
          if (texture) {
            const sprite = new Sprite(texture);
            sprite.x = px;
            sprite.y = py;
            sprite.width = CELL_SIZE;
            sprite.height = CELL_SIZE;
            itemsGraphics.addChild(sprite);
            itemDisplays.set(`${x},${y}`, sprite);
          }
        } else {
          itemsGraphics.circle(px + CELL_SIZE - 6, py + 6, 4);
          itemsGraphics.fill(colors.world.itemFallbackDot);
        }
      }
    }
  }

  // Draw grid lines (subtle)
  gridGraphics.setStrokeStyle({
    width: 0.5,
    color: colors.world.gridLine,
    alpha: 0.3,
  });
  for (let x = 0; x <= level.width; x++) {
    gridGraphics.moveTo(x * CELL_SIZE, 0);
    gridGraphics.lineTo(x * CELL_SIZE, level.height * CELL_SIZE);
    gridGraphics.stroke();
  }
  for (let y = 0; y <= level.height; y++) {
    gridGraphics.moveTo(0, y * CELL_SIZE);
    gridGraphics.lineTo(level.width * CELL_SIZE, y * CELL_SIZE);
    gridGraphics.stroke();
  }

  // Draw world boundary
  gridGraphics.rect(0, 0, level.width * CELL_SIZE, level.height * CELL_SIZE);
  gridGraphics.stroke({ width: 2, color: colors.world.worldBoundary });

  // Add all layers to viewport in correct z-order
  viewport.addChild(terrainContainer);
  viewport.addChild(gridGraphics);
  viewport.addChild(treesContainer);
  viewport.addChild(structuresGraphics);
  viewport.addChild(itemsGraphics);

  // Add info label
  const label = new Text({
    text: `Z-Level: ${level.z} | ${level.width}x${level.height} | Biome: ${level.biome}`,
    style: {
      fontSize: 14,
      fill: colors.world.infoText,
      fontFamily: "monospace",
    },
  });
  label.x = 10;
  label.y = 10;
  viewport.addChild(label);

  return {
    terrainContainer,
    treesContainer,
    structuresGraphics,
    itemsGraphics,
    treeSprites,
    itemDisplays,
  };
}

/**
 * Update the selection overlay graphics
 */
function updateSelectionOverlay(
  graphics: Graphics,
  position: Position2D | null,
  selectionZLevel: number | null,
  currentZLevel: number,
  highlightColor: number,
): void {
  graphics.clear();

  // Only show selection if on the same z-level
  if (!position || selectionZLevel !== currentZLevel) {
    return;
  }

  const px = position.x * CELL_SIZE;
  const py = position.y * CELL_SIZE;
  const padding = 2;

  // Draw selection border
  graphics.rect(
    px + padding,
    py + padding,
    CELL_SIZE - padding * 2,
    CELL_SIZE - padding * 2,
  );
  graphics.stroke({ width: 3, color: highlightColor });

  // Draw corner accents
  const cornerSize = 8;

  // Top-left corner
  graphics.moveTo(px, py + cornerSize);
  graphics.lineTo(px, py);
  graphics.lineTo(px + cornerSize, py);
  graphics.stroke({ width: 2, color: highlightColor });

  // Top-right corner
  graphics.moveTo(px + CELL_SIZE - cornerSize, py);
  graphics.lineTo(px + CELL_SIZE, py);
  graphics.lineTo(px + CELL_SIZE, py + cornerSize);
  graphics.stroke({ width: 2, color: highlightColor });

  // Bottom-left corner
  graphics.moveTo(px, py + CELL_SIZE - cornerSize);
  graphics.lineTo(px, py + CELL_SIZE);
  graphics.lineTo(px + cornerSize, py + CELL_SIZE);
  graphics.stroke({ width: 2, color: highlightColor });

  // Bottom-right corner
  graphics.moveTo(px + CELL_SIZE - cornerSize, py + CELL_SIZE);
  graphics.lineTo(px + CELL_SIZE, py + CELL_SIZE);
  graphics.lineTo(px + CELL_SIZE, py + CELL_SIZE - cornerSize);
  graphics.stroke({ width: 2, color: highlightColor });
}

/**
 * Update the hover overlay graphics
 */
function updateHoverOverlay(
  graphics: Graphics,
  position: Position2D | null,
  hoverColor: number,
): void {
  graphics.clear();

  if (!position) {
    return;
  }

  const px = position.x * CELL_SIZE;
  const py = position.y * CELL_SIZE;

  // Draw semi-transparent hover highlight
  graphics.rect(px, py, CELL_SIZE, CELL_SIZE);
  graphics.fill({ color: hoverColor, alpha: 0.15 });

  // Draw subtle border
  graphics.rect(px, py, CELL_SIZE, CELL_SIZE);
  graphics.stroke({ width: 1, color: hoverColor, alpha: 0.4 });
}

export default World;
