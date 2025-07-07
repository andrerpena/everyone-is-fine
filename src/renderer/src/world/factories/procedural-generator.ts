import { logger } from "../../lib/logger";
import type {
  BiomeType,
  StructureType,
  TerrainType,
  Tile,
  World,
  ZLevel,
} from "../types";
import { createStructureData, createTile } from "./tile-factory";
import {
  createWeatherState,
  createWorldTime,
  SeededRandom,
} from "./world-factory";

// =============================================================================
// NOISE GENERATION
// =============================================================================

/**
 * Simple value noise implementation for terrain generation.
 * Creates smooth, continuous noise patterns from a seed.
 */
class ValueNoise {
  private permutation: number[];

  constructor(seed: number) {
    const rng = new SeededRandom(seed);
    // Create permutation table
    this.permutation = [];
    for (let i = 0; i < 256; i++) {
      this.permutation[i] = i;
    }
    // Shuffle using Fisher-Yates
    for (let i = 255; i > 0; i--) {
      const j = rng.nextInt(0, i + 1);
      [this.permutation[i], this.permutation[j]] = [
        this.permutation[j],
        this.permutation[i],
      ];
    }
    // Duplicate for overflow
    this.permutation = [...this.permutation, ...this.permutation];
  }

  /** Smooth interpolation (smoothstep) */
  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  /** Linear interpolation */
  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  /** Get pseudo-random value for grid point */
  private hash(x: number, y: number): number {
    return this.permutation[(this.permutation[x & 255] + y) & 255] / 255;
  }

  /**
   * Get noise value at position (0-1 range output)
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param scale - How zoomed in the noise is (smaller = more zoomed in)
   */
  get(x: number, y: number, scale: number = 1): number {
    x *= scale;
    y *= scale;

    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = x0 + 1;
    const y1 = y0 + 1;

    const sx = this.fade(x - x0);
    const sy = this.fade(y - y0);

    const n00 = this.hash(x0, y0);
    const n10 = this.hash(x1, y0);
    const n01 = this.hash(x0, y1);
    const n11 = this.hash(x1, y1);

    const nx0 = this.lerp(n00, n10, sx);
    const nx1 = this.lerp(n01, n11, sx);

    return this.lerp(nx0, nx1, sy);
  }

  /**
   * Fractal Brownian Motion - layered noise for more natural patterns
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param octaves - Number of noise layers (more = more detail)
   * @param persistence - How much each octave contributes (0.5 typical)
   * @param scale - Base scale
   */
  fbm(
    x: number,
    y: number,
    octaves: number = 4,
    persistence: number = 0.5,
    scale: number = 0.1,
  ): number {
    let total = 0;
    let amplitude = 1;
    let maxValue = 0;
    let frequency = scale;

    for (let i = 0; i < octaves; i++) {
      total += this.get(x, y, frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    return total / maxValue;
  }
}

// =============================================================================
// CELLULAR AUTOMATA
// =============================================================================

/**
 * Apply cellular automata smoothing to create natural clustering.
 * Uses the 4-5 rule: a cell becomes "on" if 5+ neighbors are "on",
 * stays "on" if 4+ neighbors are "on".
 */
function applyCellularAutomata(
  grid: boolean[],
  width: number,
  height: number,
  iterations: number = 3,
): boolean[] {
  let current = [...grid];
  let next = new Array(width * height).fill(false);

  for (let iter = 0; iter < iterations; iter++) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        const neighbors = countNeighbors(current, x, y, width, height);
        const isAlive = current[index];

        // Birth: dead cell with 5+ neighbors becomes alive
        // Survival: alive cell with 4+ neighbors stays alive
        if (isAlive) {
          next[index] = neighbors >= 4;
        } else {
          next[index] = neighbors >= 5;
        }
      }
    }
    [current, next] = [next, current];
  }

  return current;
}

/** Count alive neighbors (8-directional) */
function countNeighbors(
  grid: boolean[],
  x: number,
  y: number,
  width: number,
  height: number,
): number {
  let count = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        if (grid[ny * width + nx]) count++;
      }
    }
  }
  return count;
}

// =============================================================================
// BIOME CONFIGURATION
// =============================================================================

/** Biome-specific generation configuration */
interface BiomeConfig {
  terrainWeights: Array<{ type: TerrainType; weight: number }>;
  treeTypes: StructureType[];
  // Forest clustering
  forestThreshold: number; // Noise value above which forest zones exist (0-1)
  forestDensity: number; // Tree density within forest zones
  forestScale: number; // Noise scale for forest clustering
  scatteredTreeChance: number; // Chance of lone trees outside forests
  // Bush clustering (understory)
  bushThreshold: number; // Noise threshold for bush zones
  bushDensity: number; // Bush density within zones
  // Water
  waterThreshold: number; // Noise threshold for water (0-1)
  waterScale: number; // Noise scale for water bodies
  // Rock formations
  rockThreshold: number; // Noise threshold for rock formations
  rockScale: number; // Noise scale for rock clustering
  boulderDensity: number; // Boulder density in rocky areas
}

const BIOME_CONFIGS: Record<BiomeType, BiomeConfig> = {
  temperate_forest: {
    terrainWeights: [
      { type: "soil", weight: 0.6 },
      { type: "gravel", weight: 0.2 },
      { type: "rock", weight: 0.2 },
    ],
    treeTypes: ["tree_oak", "tree_pine"],
    forestThreshold: 0.45,
    forestDensity: 0.5,
    forestScale: 0.08,
    scatteredTreeChance: 0.02,
    bushThreshold: 0.4,
    bushDensity: 0.15,
    waterThreshold: 0.35,
    waterScale: 0.06,
    rockThreshold: 0.72,
    rockScale: 0.1,
    boulderDensity: 0.25,
  },
  desert: {
    terrainWeights: [
      { type: "sand", weight: 0.8 },
      { type: "rock", weight: 0.15 },
      { type: "gravel", weight: 0.05 },
    ],
    treeTypes: [],
    forestThreshold: 0.95, // Almost no trees
    forestDensity: 0.1,
    forestScale: 0.05,
    scatteredTreeChance: 0.005,
    bushThreshold: 0.85,
    bushDensity: 0.05,
    waterThreshold: 0.2, // Rare oases
    waterScale: 0.04,
    rockThreshold: 0.6,
    rockScale: 0.12,
    boulderDensity: 0.3,
  },
  tundra: {
    terrainWeights: [
      { type: "soil", weight: 0.3 },
      { type: "rock", weight: 0.4 },
      { type: "gravel", weight: 0.3 },
    ],
    treeTypes: ["tree_pine"],
    forestThreshold: 0.6,
    forestDensity: 0.25,
    forestScale: 0.1,
    scatteredTreeChance: 0.01,
    bushThreshold: 0.5,
    bushDensity: 0.08,
    waterThreshold: 0.4,
    waterScale: 0.05,
    rockThreshold: 0.55,
    rockScale: 0.12,
    boulderDensity: 0.35,
  },
  jungle: {
    terrainWeights: [
      { type: "soil", weight: 0.7 },
      { type: "clay", weight: 0.2 },
      { type: "gravel", weight: 0.1 },
    ],
    treeTypes: ["tree_oak"],
    forestThreshold: 0.25, // Dense jungle
    forestDensity: 0.7,
    forestScale: 0.15,
    scatteredTreeChance: 0.1,
    bushThreshold: 0.2,
    bushDensity: 0.3,
    waterThreshold: 0.42,
    waterScale: 0.07,
    rockThreshold: 0.85,
    rockScale: 0.08,
    boulderDensity: 0.15,
  },
  mountain: {
    terrainWeights: [
      { type: "rock", weight: 0.5 },
      { type: "granite", weight: 0.3 },
      { type: "gravel", weight: 0.2 },
    ],
    treeTypes: ["tree_pine"],
    forestThreshold: 0.55,
    forestDensity: 0.35,
    forestScale: 0.08,
    scatteredTreeChance: 0.02,
    bushThreshold: 0.6,
    bushDensity: 0.1,
    waterThreshold: 0.32,
    waterScale: 0.04,
    rockThreshold: 0.4,
    rockScale: 0.15,
    boulderDensity: 0.4,
  },
  swamp: {
    terrainWeights: [
      { type: "clay", weight: 0.5 },
      { type: "soil", weight: 0.3 },
      { type: "gravel", weight: 0.2 },
    ],
    treeTypes: ["tree_oak"],
    forestThreshold: 0.4,
    forestDensity: 0.4,
    forestScale: 0.12,
    scatteredTreeChance: 0.05,
    bushThreshold: 0.35,
    bushDensity: 0.2,
    waterThreshold: 0.5,
    waterScale: 0.1,
    rockThreshold: 0.9,
    rockScale: 0.06,
    boulderDensity: 0.1,
  },
  plains: {
    terrainWeights: [
      { type: "soil", weight: 0.8 },
      { type: "gravel", weight: 0.15 },
      { type: "rock", weight: 0.05 },
    ],
    treeTypes: ["tree_oak"],
    forestThreshold: 0.65, // Sparse copses
    forestDensity: 0.4,
    forestScale: 0.06,
    scatteredTreeChance: 0.01,
    bushThreshold: 0.55,
    bushDensity: 0.12,
    waterThreshold: 0.32,
    waterScale: 0.05,
    rockThreshold: 0.8,
    rockScale: 0.08,
    boulderDensity: 0.2,
  },
};

// =============================================================================
// TERRAIN GENERATION
// =============================================================================

/** Pick terrain based on weighted probabilities */
function pickWeightedTerrain(
  rng: SeededRandom,
  weights: Array<{ type: TerrainType; weight: number }>,
): TerrainType {
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  let random = rng.next() * totalWeight;

  for (const { type, weight } of weights) {
    random -= weight;
    if (random <= 0) {
      return type;
    }
  }

  return weights[0].type;
}

/** Update pathfinding data for a tile */
function updateTilePathfinding(tile: Tile): void {
  let isPassable = true;
  let movementCost = 1;

  // Check terrain
  const terrainPassable =
    tile.terrain.type !== "water_deep" &&
    tile.terrain.type !== "lava" &&
    tile.terrain.type !== "void";

  if (!terrainPassable) {
    isPassable = false;
    movementCost = Number.POSITIVE_INFINITY;
  } else {
    // Apply terrain movement cost
    if (tile.terrain.type === "water_shallow") movementCost = 2;
    else if (tile.terrain.type === "sand") movementCost = 1.2;
    else if (tile.terrain.type === "gravel") movementCost = 1.3;
  }

  // Check structure
  if (tile.structure) {
    const structureType = tile.structure.type;
    if (
      structureType === "wall_stone" ||
      structureType === "wall_wood" ||
      structureType === "wall_metal" ||
      structureType === "wall_brick" ||
      structureType === "tree_oak" ||
      structureType === "tree_pine" ||
      structureType === "boulder"
    ) {
      isPassable = false;
      movementCost = Number.POSITIVE_INFINITY;
    }
  }

  tile.pathfinding.isPassable = isPassable;
  tile.pathfinding.movementCost = movementCost;
}

/** Generate a z-level with procedural terrain using noise and cellular automata */
export function generateZLevel(
  z: number,
  width: number,
  height: number,
  seed: number,
  biome: BiomeType,
): ZLevel {
  const rng = new SeededRandom(seed + z * 1000);
  const config = BIOME_CONFIGS[biome];

  // Create noise generators with different seeds for variety
  const waterNoise = new ValueNoise(seed + 1);
  const rockNoise = new ValueNoise(seed + 2);
  const treeNoise = new ValueNoise(seed + 3);
  const terrainNoise = new ValueNoise(seed + 4);

  const tiles: Tile[] = new Array(width * height);

  // ==========================================================================
  // Pass 1: Generate water map using noise + cellular automata
  // ==========================================================================
  const waterMap: boolean[] = new Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      // Use FBM for more natural water body shapes
      const noiseValue = waterNoise.fbm(x, y, 4, 0.5, config.waterScale);
      waterMap[index] = noiseValue < config.waterThreshold;
    }
  }

  // Apply cellular automata to create more natural lake shapes
  const smoothedWaterMap = applyCellularAutomata(waterMap, width, height, 4);

  // ==========================================================================
  // Pass 2: Generate rock formation map
  // ==========================================================================
  const rockMap: boolean[] = new Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      const noiseValue = rockNoise.fbm(x, y, 3, 0.6, config.rockScale);
      rockMap[index] = noiseValue > config.rockThreshold;
    }
  }

  // Smooth rock formations
  const smoothedRockMap = applyCellularAutomata(rockMap, width, height, 2);

  // ==========================================================================
  // Pass 3: Generate base terrain tiles
  // ==========================================================================
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      const isWater = smoothedWaterMap[index];

      let terrainType: TerrainType;

      if (isWater) {
        // Check depth based on distance from edge
        const waterDepth = countNeighbors(
          smoothedWaterMap,
          x,
          y,
          width,
          height,
        );
        terrainType = waterDepth >= 7 ? "water_deep" : "water_shallow";
      } else {
        // Use noise to add variation to terrain selection
        const terrainVariation = terrainNoise.get(x, y, 0.2);
        // Bias the random selection based on noise
        rng.next(); // Advance RNG for consistency
        terrainType = pickWeightedTerrain(rng, config.terrainWeights);

        // Override with rock in rocky areas
        if (smoothedRockMap[index] && terrainVariation > 0.3 && !isWater) {
          terrainType = rng.chance(0.5) ? "rock" : "granite";
        }
      }

      tiles[index] = createTile({
        terrain: {
          type: terrainType,
          moisture: isWater ? 1.0 : waterNoise.get(x, y, 0.1) * 0.5 + 0.25,
          temperature: 15 + terrainNoise.get(x, y, 0.05) * 10,
        },
      });
    }
  }

  // ==========================================================================
  // Pass 4: Add structures (trees, bushes, boulders) with clustering
  // ==========================================================================
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      const tile = tiles[index];

      // Skip water tiles
      if (
        tile.terrain.type === "water_shallow" ||
        tile.terrain.type === "water_deep"
      ) {
        continue;
      }

      // Get forest zone noise - determines where forests can exist
      const forestNoise = treeNoise.fbm(x, y, 4, 0.5, config.forestScale);
      const isInForestZone = forestNoise > config.forestThreshold;

      // Get bush zone noise (slightly different pattern)
      const bushNoise = treeNoise.fbm(
        x + 1000,
        y + 1000,
        3,
        0.5,
        config.forestScale * 1.5,
      );
      const isInBushZone = bushNoise > config.bushThreshold;

      // Trees: spawn in forest zones with high density, or scattered outside
      if (config.treeTypes.length > 0) {
        let shouldPlaceTree = false;

        if (isInForestZone) {
          // Inside forest zone: high density
          shouldPlaceTree = rng.chance(config.forestDensity);
        } else {
          // Outside forest zone: rare scattered trees
          shouldPlaceTree = rng.chance(config.scatteredTreeChance);
        }

        if (shouldPlaceTree) {
          tile.structure = createStructureData(rng.pick(config.treeTypes), {
            health: 150 + rng.nextInt(0, 100),
          });
          continue;
        }
      }

      // Bushes: spawn in bush zones or as forest understory
      if (isInBushZone || (isInForestZone && rng.chance(0.3))) {
        if (rng.chance(config.bushDensity)) {
          tile.structure = createStructureData("bush", {
            health: 30 + rng.nextInt(0, 20),
          });
          continue;
        }
      }

      // Boulders: spawn in rocky areas with clustering
      if (smoothedRockMap[index] && rng.chance(config.boulderDensity)) {
        tile.structure = createStructureData("boulder", {
          health: 300 + rng.nextInt(0, 200),
        });
      }
    }
  }

  // ==========================================================================
  // Pass 5: Update pathfinding cache
  // ==========================================================================
  for (let i = 0; i < tiles.length; i++) {
    updateTilePathfinding(tiles[i]);
  }

  return {
    z,
    width,
    height,
    tiles,
    isGenerated: true,
    biome,
  };
}

/** Generate a complete world with procedural generation */
export function generateWorld(
  name: string,
  width: number,
  height: number,
  options?: {
    seed?: number;
    biome?: BiomeType;
    generateUnderground?: boolean;
  },
): World {
  const seed = options?.seed ?? Math.floor(Math.random() * 2147483647);
  const biome = options?.biome ?? "temperate_forest";

  logger.info(
    `Generating world "${name}" (${width}x${height}, biome: ${biome}, seed: ${seed})`,
    ["worldgen"],
  );

  // Create world with procedurally generated surface
  const world: World = {
    metadata: {
      id: `world_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      name,
      seed,
      createdAt: Date.now(),
      version: "1.0.0",
      tickCount: 0,
    },
    dimensions: {
      width,
      height,
      minZ: options?.generateUnderground ? -5 : 0,
      maxZ: 1,
    },
    levels: new Map(),
    surfaceZ: 0,
    time: createWorldTime(),
    weather: createWeatherState(),
  };

  // Generate surface level
  const surfaceLevel = generateZLevel(0, width, height, seed, biome);
  world.levels.set(0, surfaceLevel);

  logger.info(`World generation complete: ${name}`, ["worldgen"]);
  return world;
}
