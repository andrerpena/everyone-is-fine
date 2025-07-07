import type {
  ItemData,
  Position2D,
  Position3D,
  Tile,
  World,
  ZLevel,
} from "../types";

// =============================================================================
// COORDINATE UTILITIES
// =============================================================================

/** Convert 2D coordinates to flat array index */
export function coordToIndex(x: number, y: number, width: number): number {
  return y * width + x;
}

/** Convert flat array index to 2D coordinates */
export function indexToCoord(index: number, width: number): Position2D {
  return {
    x: index % width,
    y: Math.floor(index / width),
  };
}

/** Check if coordinates are within bounds */
export function isInBounds(
  x: number,
  y: number,
  width: number,
  height: number,
): boolean {
  return x >= 0 && x < width && y >= 0 && y < height;
}

/** Check if 3D position is within world bounds */
export function isInWorldBounds(pos: Position3D, world: World): boolean {
  const { dimensions } = world;
  return (
    pos.x >= 0 &&
    pos.x < dimensions.width &&
    pos.y >= 0 &&
    pos.y < dimensions.height &&
    pos.z >= dimensions.minZ &&
    pos.z <= dimensions.maxZ
  );
}

// =============================================================================
// TILE ACCESS
// =============================================================================

/** Get a tile at a specific position on a z-level */
export function getTileAt(
  level: ZLevel,
  x: number,
  y: number,
): Tile | undefined {
  if (!isInBounds(x, y, level.width, level.height)) {
    return undefined;
  }
  return level.tiles[coordToIndex(x, y, level.width)];
}

/** Get a tile at a 3D position in the world */
export function getWorldTileAt(
  world: World,
  x: number,
  y: number,
  z: number,
): Tile | undefined {
  const level = world.levels.get(z);
  if (!level) return undefined;
  return getTileAt(level, x, y);
}

/** Set a tile at a specific position on a z-level (mutates) */
export function setTileAt(
  level: ZLevel,
  x: number,
  y: number,
  tile: Tile,
): boolean {
  if (!isInBounds(x, y, level.width, level.height)) {
    return false;
  }
  level.tiles[coordToIndex(x, y, level.width)] = tile;
  return true;
}

/** Set a tile at a 3D position in the world (mutates) */
export function setWorldTileAt(
  world: World,
  x: number,
  y: number,
  z: number,
  tile: Tile,
): boolean {
  const level = world.levels.get(z);
  if (!level) return false;
  return setTileAt(level, x, y, tile);
}

// =============================================================================
// TILE QUERIES
// =============================================================================

/** Get all tiles in a rectangular area */
export function getTilesInRect(
  level: ZLevel,
  x: number,
  y: number,
  width: number,
  height: number,
): Array<{ x: number; y: number; tile: Tile }> {
  const result: Array<{ x: number; y: number; tile: Tile }> = [];

  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      const tx = x + dx;
      const ty = y + dy;
      const tile = getTileAt(level, tx, ty);
      if (tile) {
        result.push({ x: tx, y: ty, tile });
      }
    }
  }

  return result;
}

/** Get all tiles within a radius (circular) */
export function getTilesInRadius(
  level: ZLevel,
  centerX: number,
  centerY: number,
  radius: number,
): Array<{ x: number; y: number; tile: Tile; distance: number }> {
  const result: Array<{
    x: number;
    y: number;
    tile: Tile;
    distance: number;
  }> = [];
  const radiusSquared = radius * radius;

  for (let y = centerY - radius; y <= centerY + radius; y++) {
    for (let x = centerX - radius; x <= centerX + radius; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distSquared = dx * dx + dy * dy;

      if (distSquared <= radiusSquared) {
        const tile = getTileAt(level, x, y);
        if (tile) {
          result.push({
            x,
            y,
            tile,
            distance: Math.sqrt(distSquared),
          });
        }
      }
    }
  }

  return result;
}

/** Get neighboring tiles (4-directional) */
export function getNeighbors4(
  level: ZLevel,
  x: number,
  y: number,
): Array<{ x: number; y: number; tile: Tile }> {
  const directions = [
    { dx: 0, dy: -1 }, // North
    { dx: 1, dy: 0 }, // East
    { dx: 0, dy: 1 }, // South
    { dx: -1, dy: 0 }, // West
  ];

  const result: Array<{ x: number; y: number; tile: Tile }> = [];

  for (const { dx, dy } of directions) {
    const tile = getTileAt(level, x + dx, y + dy);
    if (tile) {
      result.push({ x: x + dx, y: y + dy, tile });
    }
  }

  return result;
}

/** Get neighboring tiles (8-directional including diagonals) */
export function getNeighbors8(
  level: ZLevel,
  x: number,
  y: number,
): Array<{ x: number; y: number; tile: Tile }> {
  const result: Array<{ x: number; y: number; tile: Tile }> = [];

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;

      const tile = getTileAt(level, x + dx, y + dy);
      if (tile) {
        result.push({ x: x + dx, y: y + dy, tile });
      }
    }
  }

  return result;
}

// =============================================================================
// ITEM OPERATIONS
// =============================================================================

/** Add an item to a tile */
export function addItemToTile(tile: Tile, item: ItemData): void {
  // Check if we can stack with existing item
  const existingItem = tile.items.find(
    (i) =>
      i.type === item.type &&
      i.material === item.material &&
      i.quality === item.quality,
  );

  if (existingItem) {
    existingItem.quantity += item.quantity;
  } else {
    tile.items.push({ ...item });
  }
}

/** Remove an item from a tile by ID */
export function removeItemFromTile(
  tile: Tile,
  itemId: string,
): ItemData | undefined {
  const index = tile.items.findIndex((i) => i.id === itemId);
  if (index === -1) return undefined;

  return tile.items.splice(index, 1)[0];
}

/** Find all tiles with a specific item type */
export function findTilesWithItem(
  level: ZLevel,
  itemType: string,
): Array<{ x: number; y: number; tile: Tile; items: ItemData[] }> {
  const result: Array<{
    x: number;
    y: number;
    tile: Tile;
    items: ItemData[];
  }> = [];

  for (let y = 0; y < level.height; y++) {
    for (let x = 0; x < level.width; x++) {
      const tile = level.tiles[coordToIndex(x, y, level.width)];
      const matchingItems = tile.items.filter((i) => i.type === itemType);

      if (matchingItems.length > 0) {
        result.push({ x, y, tile, items: matchingItems });
      }
    }
  }

  return result;
}
