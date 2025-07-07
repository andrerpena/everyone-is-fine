import { Dock } from "@renderer/components/dock/Dock";
import { StatusBar } from "@renderer/components/status-bars";
import { useIsSlotEmpty, WidgetSlot } from "@renderer/components/widgets";
import { useEffect, useRef } from "react";
import { commandRegistry } from "../commands";
import { useColony } from "../context/ColonyContext";
import {
  useCharacterActions,
  useCurrentZLevel,
  useWorld,
  useWorldActions,
} from "../game-state";
import { createCharacter } from "../simulation/types";
import { useGameColorStore } from "../theming/game-color-store";
import { generateWorld } from "../world/factories/procedural-generator";
import { SeededRandom } from "../world/factories/world-factory";
import type { BiomeType, ZLevel } from "../world/types";

// Default world generation configuration
const DEFAULT_WORLD_CONFIG = {
  name: "New Colony",
  width: 100,
  height: 100,
  seed: 42,
  biome: "temperate_forest" as BiomeType,
};

const COLONIST_NAMES = ["Alice", "Bob", "Charlie"];

/**
 * Find a cluster of nearby passable tiles for spawning characters.
 * Uses seeded RNG for deterministic results.
 */
function findSpawnCluster(
  level: ZLevel,
  count: number,
  seed: number,
): Array<{ x: number; y: number }> {
  const rng = new SeededRandom(seed);

  // Collect all passable tiles
  const passableTiles: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < level.height; y++) {
    for (let x = 0; x < level.width; x++) {
      const tile = level.tiles[y * level.width + x];
      if (tile?.pathfinding?.isPassable) {
        passableTiles.push({ x, y });
      }
    }
  }

  if (passableTiles.length === 0) return [];

  // Pick a deterministic starting point near the center
  const centerX = Math.floor(level.width / 2);
  const centerY = Math.floor(level.height / 2);

  // Find passable tiles near center, sorted by distance
  const tilesWithDistance = passableTiles.map((tile) => ({
    ...tile,
    distance: Math.abs(tile.x - centerX) + Math.abs(tile.y - centerY),
  }));
  tilesWithDistance.sort((a, b) => a.distance - b.distance);

  // Pick a starting tile from the closest 20% using seeded RNG
  const candidateCount = Math.max(
    1,
    Math.floor(tilesWithDistance.length * 0.2),
  );
  const startIndex = rng.nextInt(0, candidateCount);
  const startTile = tilesWithDistance[startIndex];

  // Find nearby passable tiles (within 5 tiles of start)
  const maxSpawnRadius = 5;
  const nearbyTiles = passableTiles.filter((tile) => {
    const dx = Math.abs(tile.x - startTile.x);
    const dy = Math.abs(tile.y - startTile.y);
    return dx <= maxSpawnRadius && dy <= maxSpawnRadius;
  });

  // Sort by distance from start tile for consistent ordering
  nearbyTiles.sort((a, b) => {
    const distA = Math.abs(a.x - startTile.x) + Math.abs(a.y - startTile.y);
    const distB = Math.abs(b.x - startTile.x) + Math.abs(b.y - startTile.y);
    return distA - distB;
  });

  // Take the first 'count' tiles (closest to start)
  return nearbyTiles.slice(0, count);
}

export const GameScreen: React.FC = () => {
  const { setWorld } = useWorldActions();
  const { addCharacter } = useCharacterActions();
  const { game } = useColony();
  const world = useWorld();
  const currentZLevel = useCurrentZLevel();
  // undefined = not spawned, string = spawned & waiting to focus, null = spawned & focused
  const characterToFocusRef = useRef<string | null | undefined>(undefined);

  // Generate and set world on mount
  useEffect(() => {
    const config = DEFAULT_WORLD_CONFIG;
    const newWorld = generateWorld(config.name, config.width, config.height, {
      seed: config.seed,
      biome: config.biome,
    });
    setWorld(newWorld, config);
  }, [setWorld]);

  // Spawn demo characters after world is loaded
  useEffect(() => {
    if (!world || characterToFocusRef.current !== undefined) return;

    const level = world.levels.get(currentZLevel);
    if (!level) return;

    // Use the world seed for deterministic spawning
    const spawnPositions = findSpawnCluster(
      level,
      3,
      DEFAULT_WORLD_CONFIG.seed,
    );
    if (spawnPositions.length === 0) return;

    // Create demo colonists
    const { colonistPalette, colonistFallback } =
      useGameColorStore.getState().resolved.characters;
    let firstCharacterId: string | null = null;
    spawnPositions.forEach((pos, index) => {
      const character = createCharacter({
        name: COLONIST_NAMES[index] ?? `Colonist ${index + 1}`,
        type: "colonist",
        position: { x: pos.x, y: pos.y, z: currentZLevel },
        color: colonistPalette[index] ?? colonistFallback,
      });
      addCharacter(character);
      if (index === 0) {
        firstCharacterId = character.id;
      }
    });

    // Store the first character ID to focus after world is ready (null if none)
    console.info(
      "[GameScreen] Spawned characters at positions:",
      spawnPositions,
    );
    characterToFocusRef.current = firstCharacterId;
  }, [world, currentZLevel, addCharacter]);

  // Subscribe to world.ready to focus on the first character after viewport is initialized
  useEffect(() => {
    const unsubscribe = commandRegistry.on("world.ready", () => {
      if (characterToFocusRef.current) {
        console.info(
          "[GameScreen] World ready, focusing on character:",
          characterToFocusRef.current,
        );
        game.focusCharacter(characterToFocusRef.current);
        game.setZoom(2);
        characterToFocusRef.current = null; // Clear after focusing
      }
    });
    return unsubscribe;
  }, [game]);

  // Check which slots are empty to conditionally render them
  const isLeftTopEmpty = useIsSlotEmpty("left-top");
  const isLeftBottomEmpty = useIsSlotEmpty("left-bottom");
  const isCenterBottomEmpty = useIsSlotEmpty("center-bottom");
  const isRightTopEmpty = useIsSlotEmpty("right-top");
  const isRightBottomEmpty = useIsSlotEmpty("right-bottom");

  return (
    <Dock
      leftTop={isLeftTopEmpty ? undefined : <WidgetSlot slotId="left-top" />}
      leftBottom={
        isLeftBottomEmpty ? undefined : <WidgetSlot slotId="left-bottom" />
      }
      center={<WidgetSlot slotId="center" variant="primary" keepMounted />}
      centerBottom={
        isCenterBottomEmpty ? undefined : <WidgetSlot slotId="center-bottom" />
      }
      rightTop={isRightTopEmpty ? undefined : <WidgetSlot slotId="right-top" />}
      rightBottom={
        isRightBottomEmpty ? undefined : <WidgetSlot slotId="right-bottom" />
      }
      bottom={<StatusBar />}
    />
  );
};
