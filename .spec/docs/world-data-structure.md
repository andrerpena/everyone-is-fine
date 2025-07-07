# World Data Structure

This document explains how the world data structure works in Everyone is fine, a game inspired by Dwarf Fortress and RimWorld.

## Overview

The world is a 3D grid organized into **z-levels** (horizontal slices). Each z-level contains a 2D grid of **tiles**, where each tile has multiple **layers** representing different aspects of the game world.

```
World
├── Z-Level 1 (sky)
├── Z-Level 0 (surface) ← Ground floor
├── Z-Level -1 (underground)
└── Z-Level -2 (deep underground)
    └── Tiles[y * width + x]
        ├── Terrain Layer
        ├── Floor Layer
        ├── Structure Layer
        ├── Items Layer
        └── Pathfinding Cache
```

## Core Concepts

### Coordinate System

- **X-axis**: West to East (left to right)
- **Y-axis**: North to South (top to bottom)
- **Z-axis**: Underground to Sky (negative = underground, 0 = surface, positive = above ground)

```typescript
interface Position2D {
  x: number;
  y: number;
}

interface Position3D extends Position2D {
  z: number;  // Z-level
}
```

### Flat Array Storage

Tiles are stored in a **flat array** rather than a 2D array for performance and serialization:

```typescript
// Access pattern: tiles[y * width + x]
const index = y * level.width + x;
const tile = level.tiles[index];
```

This provides:
- Better memory locality
- Efficient JSON serialization
- Easy transfer to Web Workers via structured clone

## Tile Layers

Each tile combines multiple layers:

```typescript
interface Tile {
  terrain: TerrainData;           // Natural ground (always present)
  floor: FloorData | null;        // Constructed floor (optional)
  structure: StructureData | null; // Walls, furniture, trees (optional)
  items: ItemData[];              // Resources on ground
  pathfinding: TilePathfindingData; // Cached movement data
  visibility: TileVisibility;     // Fog of war state
}
```

### 1. Terrain Layer

The natural ground that exists before any construction. Terrain determines base properties like fertility and movement cost.

```typescript
interface TerrainData {
  type: TerrainType;    // "soil", "sand", "rock", "water_shallow", etc.
  moisture: number;     // 0-1, affects plant growth
  temperature: number;  // Celsius
}
```

**Terrain Types:**
| Type | Fertility | Passable | Movement Cost | Notes |
|------|-----------|----------|---------------|-------|
| soil | 1.0 | Yes | 1.0 | Best for farming |
| sand | 0.1 | Yes | 1.2 | Slows movement |
| clay | 0.7 | Yes | 1.1 | Good for farming |
| gravel | 0.0 | Yes | 1.3 | Slows movement |
| rock | 0.0 | Yes | 1.0 | Can be mined |
| granite | 0.0 | Yes | 1.0 | Hard to mine |
| water_shallow | 0.0 | Yes | 2.0 | Very slow |
| water_deep | 0.0 | No | ∞ | Impassable |
| lava | 0.0 | No | ∞ | Impassable, deadly |
| void | 0.0 | No | ∞ | Empty space |

### 2. Floor Layer

Constructed floors placed on top of terrain. Floors can improve movement speed or aesthetics.

```typescript
interface FloorData {
  type: FloorType;        // "wood_plank", "stone_tile", etc.
  material?: MaterialType; // What material was used
  condition: number;      // 0-1, degrades over time
}
```

**Floor Types:** `wood_plank`, `stone_tile`, `stone_flagstone`, `marble_tile`, `metal_grate`, `carpet`, `concrete`, `dirt_path`

### 3. Structure Layer

Buildings, furniture, and natural features that occupy the tile.

```typescript
interface StructureData {
  type: StructureType;
  material?: MaterialType;
  health: number;
  rotation: 0 | 90 | 180 | 270;
  ownerId?: EntityId;     // For furniture ownership
  isOpen?: boolean;       // For doors
}
```

**Structure Categories:**

| Category | Examples | Blocks Movement | Blocks Vision |
|----------|----------|-----------------|---------------|
| Wall | wall_stone, wall_wood | Yes | Yes |
| Door | door_wood, door_metal | No (openable) | Yes |
| Furniture | bed, chair, table | No | No |
| Machine | workbench | No | No |
| Container | chest, shelf | No | No |
| Natural | tree_oak, boulder | Yes | No |

### 4. Items Layer

Resources and objects lying on the ground. Multiple items can occupy the same tile.

```typescript
interface ItemData {
  id: EntityId;
  type: ItemType;         // "wood_log", "stone_block", "meal_simple"
  quantity: number;
  quality: number;        // 0-1
  material?: MaterialType;
  condition?: number;     // For degradable items
}
```

### 5. Pathfinding Cache

Pre-computed data for efficient pathfinding. Updated when terrain or structures change.

```typescript
interface TilePathfindingData {
  isPassable: boolean;
  movementCost: number;
  lastUpdated: number;    // Tick for cache invalidation
}
```

### 6. Visibility (Fog of War)

Tracks what colonists can see.

```typescript
interface TileVisibility {
  explored: boolean;      // Has any colonist ever seen this?
  visible: boolean;       // Currently in line of sight?
  lightLevel: number;     // 0-1
}
```

## Z-Level Structure

Each z-level is a horizontal slice of the world:

```typescript
interface ZLevel {
  z: number;              // Z coordinate
  width: number;
  height: number;
  tiles: Tile[];          // Flat array: tiles[y * width + x]
  isGenerated: boolean;   // Has procedural generation run?
  biome: BiomeType;
}
```

## World Structure

The complete world state:

```typescript
interface World {
  metadata: WorldMetadata;
  dimensions: WorldDimensions;
  levels: Map<number, ZLevel>;  // Sparse storage by z-coordinate
  surfaceZ: number;             // Ground floor z-level
  time: WorldTime;
  weather: WeatherState;
}
```

**Why Map for levels?** Using `Map<number, ZLevel>` allows sparse storage - only generated levels consume memory. Underground levels are generated on-demand when colonists dig down.

## Serialization

For game saves and Web Worker transfer, the world can be serialized:

```typescript
// Serialize for saving
const serialized = serializeWorld(world);
const json = JSON.stringify(serialized);

// Deserialize when loading
const data = JSON.parse(json);
const world = deserializeWorld(data);
```

The `SerializedWorld` type converts `Map` to arrays for JSON compatibility:

```typescript
interface SerializedWorld {
  metadata: WorldMetadata;
  dimensions: WorldDimensions;
  levels: Array<[number, ZLevel]>;  // Map entries as array
  surfaceZ: number;
  time: WorldTime;
  weather: WeatherState;
}
```

## Property Registries

Static properties are stored in registries separate from instance data to reduce memory:

```typescript
import { getTerrainProperties, getStructureProperties } from "@renderer/world";

// Get terrain properties
const soilProps = getTerrainProperties("soil");
// → { fertility: 1.0, hardness: 0.2, isPassable: true, movementCost: 1.0, ... }

// Get structure properties
const wallProps = getStructureProperties("wall_stone");
// → { blocksMovement: true, blocksVision: true, maxHealth: 500, ... }
```

## Utility Functions

### Coordinate Utilities

```typescript
import { coordToIndex, indexToCoord, isInBounds } from "@renderer/world";

// Convert 2D coords to flat index
const index = coordToIndex(5, 10, level.width);  // → 10 * width + 5

// Convert index back to coords
const { x, y } = indexToCoord(index, level.width);

// Check bounds
if (isInBounds(x, y, level.width, level.height)) {
  // Safe to access
}
```

### Tile Access

```typescript
import { getTileAt, setTileAt, getWorldTileAt } from "@renderer/world";

// Get tile on a z-level
const tile = getTileAt(level, 5, 10);

// Get tile at 3D position
const tile = getWorldTileAt(world, 5, 10, 0);

// Set tile (mutates)
setTileAt(level, 5, 10, newTile);
```

### Spatial Queries

```typescript
import { getNeighbors4, getNeighbors8, getTilesInRadius } from "@renderer/world";

// Get 4-directional neighbors (N, E, S, W)
const neighbors = getNeighbors4(level, x, y);

// Get 8-directional neighbors (includes diagonals)
const neighbors = getNeighbors8(level, x, y);

// Get all tiles within radius
const tiles = getTilesInRadius(level, centerX, centerY, radius);
// → [{ x, y, tile, distance }, ...]
```

## World Generation

### Factory Functions

```typescript
import { createWorld, createZLevel, createTile } from "@renderer/world";

// Create empty world
const world = createWorld("My Colony", {
  width: 128,
  height: 128,
  minZ: -5,
  maxZ: 1
});

// Create a z-level
const level = createZLevel(0, 64, 64, "temperate_forest");

// Create a tile
const tile = createTile({
  terrain: { type: "soil", moisture: 0.7 },
  structure: createStructureData("tree_oak")
});
```

### Procedural Generation

```typescript
import { generateWorld, generateZLevel } from "@renderer/world";

// Generate complete world with terrain
const world = generateWorld("My Colony", 64, 64, {
  seed: 12345,           // For reproducibility
  biome: "temperate_forest"
});

// Generate single z-level
const level = generateZLevel(0, 64, 64, seed, "desert");
```

### Generation Algorithm

The procedural generator uses a multi-pass approach with **noise-based clustering**:

1. **Value Noise + FBM** - Creates smooth, continuous patterns using Fractal Brownian Motion
2. **Cellular Automata** - Smooths features into natural clusters (4-5 rule for lakes)
3. **Threshold-based placement** - Features spawn above/below noise thresholds

```
Pass 1: Generate water map (noise + cellular automata smoothing)
Pass 2: Generate rock formation map (noise + smoothing)
Pass 3: Place terrain tiles based on maps
Pass 4: Add structures (trees, bushes, boulders) with clustering
Pass 5: Update pathfinding cache
```

### Clustering System

Features cluster naturally using noise thresholds:

**Water Bodies:**
- Noise value below `waterThreshold` → water tile
- Cellular automata (4 iterations) creates natural lake shapes
- Deep water in centers (7+ water neighbors), shallow at edges

**Forests:**
- `forestNoise > forestThreshold` → forest zone
- Inside zone: high tree density (`forestDensity`)
- Outside zone: rare scattered trees (`scatteredTreeChance`)

**Bushes:**
- Separate noise pattern with `bushThreshold`
- Also spawns as forest understory (30% chance in forest zones)

**Rock Formations:**
- `rockNoise > rockThreshold` → rocky area
- Boulders spawn with `boulderDensity` in these areas

### Biomes

Each biome is configured with clustering parameters:

| Biome | Forest Threshold | Forest Density | Water Threshold | Boulder Density |
|-------|------------------|----------------|-----------------|-----------------|
| temperate_forest | 0.45 | 50% | 0.35 | 25% |
| desert | 0.95 | 10% | 0.20 | 30% |
| tundra | 0.60 | 25% | 0.40 | 35% |
| jungle | 0.25 | 70% | 0.42 | 15% |
| mountain | 0.55 | 35% | 0.32 | 40% |
| swamp | 0.40 | 40% | 0.50 | 10% |
| plains | 0.65 | 40% | 0.32 | 20% |

**Biome Config Structure:**
```typescript
interface BiomeConfig {
  terrainWeights: Array<{ type: TerrainType; weight: number }>;
  treeTypes: StructureType[];
  // Forest clustering
  forestThreshold: number;    // Noise threshold for forest zones
  forestDensity: number;      // Tree density in forests
  forestScale: number;        // Noise scale (smaller = larger forests)
  scatteredTreeChance: number;// Lone trees outside forests
  // Bush clustering
  bushThreshold: number;
  bushDensity: number;
  // Water
  waterThreshold: number;
  waterScale: number;
  // Rock formations
  rockThreshold: number;
  rockScale: number;
  boulderDensity: number;
}
```

### Seeded Random

Use `SeededRandom` for reproducible generation:

```typescript
import { SeededRandom } from "@renderer/world";

const rng = new SeededRandom(12345);

rng.next();           // → 0-1 float
rng.nextInt(0, 10);   // → 0-9 integer
rng.chance(0.3);      // → true 30% of time
rng.pick(["a", "b"]); // → random element
```

### Value Noise

The `ValueNoise` class generates smooth, continuous noise patterns:

```typescript
// Internal to procedural-generator.ts
const noise = new ValueNoise(seed);

// Single noise sample (0-1 output)
noise.get(x, y, scale);

// Fractal Brownian Motion - layered noise for natural patterns
noise.fbm(x, y, octaves, persistence, scale);
// octaves: number of layers (more = more detail)
// persistence: amplitude decay (0.5 typical)
// scale: zoom level (smaller = larger features)
```

FBM combines multiple noise octaves at different frequencies, creating the natural-looking patterns used for terrain features.

## File Organization

```
src/renderer/src/world/
├── index.ts                    # Main barrel export
├── types.ts                    # All type definitions
├── registries/
│   ├── index.ts
│   ├── terrain-registry.ts     # Terrain properties
│   └── structure-registry.ts   # Structure properties
├── factories/
│   ├── index.ts
│   ├── tile-factory.ts         # Tile creation
│   ├── world-factory.ts        # World/ZLevel creation
│   └── procedural-generator.ts # Biome-based generation
└── utils/
    ├── index.ts
    ├── tile-utils.ts           # Coordinate utils, queries
    └── serialization.ts        # Save/load utilities
```

## Usage Example

```typescript
import {
  generateWorld,
  getTileAt,
  getTerrainProperties,
  serializeWorld
} from "@renderer/world";

// Generate a world
const world = generateWorld("Test Colony", 64, 64, {
  seed: 42,
  biome: "temperate_forest"
});

// Get surface level
const surface = world.levels.get(0)!;

// Check a tile
const tile = getTileAt(surface, 10, 10);
if (tile) {
  console.log("Terrain:", tile.terrain.type);

  const props = getTerrainProperties(tile.terrain.type);
  console.log("Fertility:", props.fertility);

  if (tile.structure) {
    console.log("Structure:", tile.structure.type);
  }
}

// Save the world
const json = JSON.stringify(serializeWorld(world));
localStorage.setItem("save", json);
```

## Future Considerations

The data structure is designed to support:

1. **Web Worker simulation** - Serializable for structured clone transfer
2. **Chunk-based loading** - `CHUNK_SIZE` constant (16) for future chunking
3. **ECS entities** - EntityId references for colonists, creatures
4. **Pathfinding** - Pre-computed cache with tick-based invalidation
5. **Fog of war** - Per-tile visibility tracking
6. **Multi-level navigation** - Z-level support for stairs, ramps, mining
