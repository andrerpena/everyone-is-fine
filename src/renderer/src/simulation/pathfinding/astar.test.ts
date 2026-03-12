import { describe, expect, it } from "vitest";
import type { Tile, ZLevel } from "../../world/types";
import { findPath } from "./astar";

function makeTile(passable = true): Tile {
  return {
    terrain: { type: "soil", moisture: 0.5, temperature: 20 },
    floor: null,
    structure: null,
    items: [],
    pathfinding: { isPassable: passable, movementCost: 1, lastUpdated: 0 },
    visibility: { explored: false, visible: false, lightLevel: 0 },
    snowDepth: 0,
    filth: 0,
    crop: null,
    blueprint: null,
  };
}

function makeLevel(
  width: number,
  height: number,
  blocked?: Set<string>,
): ZLevel {
  const tiles: Tile[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const key = `${x},${y}`;
      tiles.push(makeTile(!blocked?.has(key)));
    }
  }
  return {
    z: 0,
    width,
    height,
    tiles,
    isGenerated: true,
    biome: "temperate_forest",
  };
}

describe("findPath", () => {
  it("finds a straight-line path on open grid", () => {
    const level = makeLevel(5, 5);
    const result = findPath(level, { x: 0, y: 0, z: 0 }, { x: 4, y: 0, z: 0 });
    expect(result.found).toBe(true);
    expect(result.path.length).toBeGreaterThan(1);
    expect(result.path[0]).toEqual({ x: 0, y: 0, z: 0 });
    expect(result.path[result.path.length - 1]).toEqual({ x: 4, y: 0, z: 0 });
  });

  it("returns not found when goal is blocked", () => {
    const blocked = new Set(["4,0"]);
    const level = makeLevel(5, 5, blocked);
    const result = findPath(level, { x: 0, y: 0, z: 0 }, { x: 4, y: 0, z: 0 });
    expect(result.found).toBe(false);
  });

  it("finds path around obstacle", () => {
    // Block column x=2 except at y=3
    const blocked = new Set(["2,0", "2,1", "2,2", "2,4"]);
    const level = makeLevel(5, 5, blocked);
    const result = findPath(level, { x: 0, y: 0, z: 0 }, { x: 4, y: 0, z: 0 });
    expect(result.found).toBe(true);
    // Path must go through the gap at (2,3)
    const passesGap = result.path.some((p) => p.x === 2 && p.y === 3);
    expect(passesGap).toBe(true);
  });
});

describe("findPath with allowedTiles", () => {
  it("finds path when all tiles are in allowed set", () => {
    const level = makeLevel(5, 1);
    const allowed = new Set(["0,0", "1,0", "2,0", "3,0", "4,0"]);
    const result = findPath(
      level,
      { x: 0, y: 0, z: 0 },
      { x: 4, y: 0, z: 0 },
      { allowedTiles: allowed },
    );
    expect(result.found).toBe(true);
  });

  it("fails when goal is outside allowed tiles", () => {
    const level = makeLevel(5, 1);
    const allowed = new Set(["0,0", "1,0", "2,0", "3,0"]);
    const result = findPath(
      level,
      { x: 0, y: 0, z: 0 },
      { x: 4, y: 0, z: 0 },
      { allowedTiles: allowed },
    );
    expect(result.found).toBe(false);
  });

  it("fails when path would leave allowed area", () => {
    // 5x5 grid, allowed is a small square, goal is reachable on the grid but
    // the only path goes outside the allowed area
    const level = makeLevel(5, 5);
    // Allow only the edges of row 0 and row 4, but not the middle
    const allowed = new Set(["0,0", "1,0", "4,0", "0,4", "4,4"]);
    const result = findPath(
      level,
      { x: 0, y: 0, z: 0 },
      { x: 4, y: 0, z: 0 },
      { allowedTiles: allowed },
    );
    // Can't reach (4,0) from (0,0) because (2,0) and (3,0) aren't allowed
    // and diagonal through (1,1) isn't allowed either
    expect(result.found).toBe(false);
  });

  it("finds path through allowed corridor", () => {
    const level = makeLevel(5, 3);
    // Allow a corridor: (0,1) → (1,1) → (2,1) → (3,1) → (4,1) plus start/end
    const allowed = new Set(["0,0", "0,1", "1,1", "2,1", "3,1", "4,1", "4,0"]);
    const result = findPath(
      level,
      { x: 0, y: 0, z: 0 },
      { x: 4, y: 0, z: 0 },
      { allowedTiles: allowed },
    );
    expect(result.found).toBe(true);
    // All path tiles must be in the allowed set
    for (const pos of result.path) {
      expect(allowed.has(`${pos.x},${pos.y}`)).toBe(true);
    }
  });

  it("works with undefined allowedTiles (unrestricted)", () => {
    const level = makeLevel(5, 1);
    const result = findPath(
      level,
      { x: 0, y: 0, z: 0 },
      { x: 4, y: 0, z: 0 },
      { allowedTiles: undefined },
    );
    expect(result.found).toBe(true);
  });
});
