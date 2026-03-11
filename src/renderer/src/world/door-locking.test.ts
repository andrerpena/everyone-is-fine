import { describe, expect, it } from "vitest";
import { STRUCTURE_REGISTRY } from "./registries/structure-registry";
import type { StructureData, Tile } from "./types";
import { DEFAULT_TILE } from "./types";

/** Helper to create a tile with a door */
function createDoorTile(
  doorType: "door_wood" | "door_metal" | "door_auto",
  overrides?: Partial<StructureData>,
): Tile {
  return {
    ...DEFAULT_TILE,
    structure: {
      type: doorType,
      health: 100,
      rotation: 0,
      ...overrides,
    },
    pathfinding: {
      isPassable: true,
      movementCost: 1,
      lastUpdated: 0,
    },
  };
}

describe("door locking", () => {
  it("StructureData supports isLocked field", () => {
    const structure: StructureData = {
      type: "door_wood",
      health: 100,
      rotation: 0,
      isLocked: true,
    };
    expect(structure.isLocked).toBe(true);
  });

  it("isLocked defaults to undefined (unlocked)", () => {
    const structure: StructureData = {
      type: "door_wood",
      health: 100,
      rotation: 0,
    };
    expect(structure.isLocked).toBeUndefined();
  });

  it("all door types are in the door category", () => {
    const doorTypes = ["door_wood", "door_metal", "door_auto"] as const;
    for (const doorType of doorTypes) {
      expect(STRUCTURE_REGISTRY[doorType].category).toBe("door");
    }
  });

  it("doors do not block movement by default in registry", () => {
    const doorTypes = ["door_wood", "door_metal", "door_auto"] as const;
    for (const doorType of doorTypes) {
      expect(STRUCTURE_REGISTRY[doorType].blocksMovement).toBe(false);
    }
  });

  it("locking a door should set isLocked and make tile impassable", () => {
    const tile = createDoorTile("door_wood");

    // Simulate locking
    tile.structure!.isLocked = true;
    tile.pathfinding = {
      isPassable: false,
      movementCost: tile.pathfinding.movementCost,
      lastUpdated: Date.now(),
    };

    expect(tile.structure!.isLocked).toBe(true);
    expect(tile.pathfinding.isPassable).toBe(false);
  });

  it("unlocking a door should clear isLocked and make tile passable", () => {
    const tile = createDoorTile("door_wood", { isLocked: true });
    tile.pathfinding = { isPassable: false, movementCost: 1, lastUpdated: 0 };

    // Simulate unlocking
    tile.structure!.isLocked = false;
    tile.pathfinding = {
      isPassable: true,
      movementCost: tile.pathfinding.movementCost,
      lastUpdated: Date.now(),
    };

    expect(tile.structure!.isLocked).toBe(false);
    expect(tile.pathfinding.isPassable).toBe(true);
  });

  it("isOpen and isLocked are independent", () => {
    const structure: StructureData = {
      type: "door_metal",
      health: 300,
      rotation: 0,
      isOpen: true,
      isLocked: true,
    };
    expect(structure.isOpen).toBe(true);
    expect(structure.isLocked).toBe(true);
  });

  it("door state can be read from tile structure", () => {
    const tile = createDoorTile("door_auto", {
      isOpen: false,
      isLocked: true,
    });

    const structure = tile.structure!;
    const isDoor = STRUCTURE_REGISTRY[structure.type].category === "door";

    expect(isDoor).toBe(true);
    expect(structure.isOpen ?? false).toBe(false);
    expect(structure.isLocked ?? false).toBe(true);
  });
});
