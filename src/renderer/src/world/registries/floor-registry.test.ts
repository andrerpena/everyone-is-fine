import { describe, expect, it } from "vitest";
import {
  FLOOR_CONSTRUCTION_REGISTRY,
  FLOOR_REGISTRY,
  getFloorConstructionCost,
  getFloorProperties,
  isFloorBuildable,
} from "./floor-registry";

describe("floor-registry", () => {
  it("defines properties for all floor types", () => {
    expect(FLOOR_REGISTRY.none).toBeDefined();
    expect(FLOOR_REGISTRY.wood_plank).toBeDefined();
    expect(FLOOR_REGISTRY.stone_tile).toBeDefined();
    expect(FLOOR_REGISTRY.marble_tile).toBeDefined();
  });

  it("none floor has neutral values", () => {
    const none = FLOOR_REGISTRY.none;
    expect(none.movementCost).toBe(1);
    expect(none.beauty).toBe(0);
    expect(none.baseValue).toBe(0);
  });

  it("built floors have movement cost < 1", () => {
    expect(FLOOR_REGISTRY.wood_plank.movementCost).toBeLessThan(1);
    expect(FLOOR_REGISTRY.stone_tile.movementCost).toBeLessThan(1);
    expect(FLOOR_REGISTRY.marble_tile.movementCost).toBeLessThan(1);
  });

  it("marble_tile has highest beauty", () => {
    const marbleBeauty = FLOOR_REGISTRY.marble_tile.beauty;
    for (const [type, props] of Object.entries(FLOOR_REGISTRY)) {
      if (type !== "marble_tile") {
        expect(props.beauty).toBeLessThanOrEqual(marbleBeauty);
      }
    }
  });

  it("isFloorBuildable returns true for buildable floors", () => {
    expect(isFloorBuildable("wood_plank")).toBe(true);
    expect(isFloorBuildable("stone_tile")).toBe(true);
    expect(isFloorBuildable("carpet")).toBe(true);
  });

  it("isFloorBuildable returns false for non-buildable floors", () => {
    expect(isFloorBuildable("none")).toBe(false);
    expect(isFloorBuildable("dirt_path")).toBe(false);
  });

  it("getFloorConstructionCost returns cost for buildable floors", () => {
    const cost = getFloorConstructionCost("wood_plank");
    expect(cost).not.toBeNull();
    expect(cost!.materials).toEqual([{ type: "wood", quantity: 2 }]);
    expect(cost!.workTicks).toBe(120);
  });

  it("getFloorConstructionCost returns null for non-buildable floors", () => {
    expect(getFloorConstructionCost("none")).toBeNull();
    expect(getFloorConstructionCost("dirt_path")).toBeNull();
  });

  it("getFloorProperties returns correct properties", () => {
    const props = getFloorProperties("stone_flagstone");
    expect(props.type).toBe("stone_flagstone");
    expect(props.movementCost).toBe(0.75);
    expect(props.beauty).toBe(2);
  });

  it("all construction costs have materials and positive work ticks", () => {
    for (const [_type, cost] of Object.entries(FLOOR_CONSTRUCTION_REGISTRY)) {
      expect(cost.materials.length).toBeGreaterThan(0);
      expect(cost.workTicks).toBeGreaterThan(0);
    }
  });
});
