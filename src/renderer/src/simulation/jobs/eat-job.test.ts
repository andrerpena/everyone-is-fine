import { describe, expect, it } from "vitest";
import { ITEM_REGISTRY } from "../../world/registries/item-registry";
import { createEatJob } from "./job-factory";

describe("createEatJob", () => {
  it("creates a job with correct type and steps", () => {
    const job = createEatJob("char_1", { x: 5, y: 3, z: 0 }, "item_abc");

    expect(job.type).toBe("eat");
    expect(job.characterId).toBe("char_1");
    expect(job.steps).toHaveLength(4);
    expect(job.steps[0].type).toBe("move");
    expect(job.steps[1].type).toBe("pickup_item");
    expect(job.steps[2].type).toBe("work");
    expect(job.steps[3].type).toBe("consume_item");
  });

  it("references the correct item ID in pickup step", () => {
    const job = createEatJob("char_1", { x: 0, y: 0, z: 0 }, "item_xyz");
    const pickupStep = job.steps[1];
    if (pickupStep.type !== "pickup_item") throw new Error("Expected pickup");
    expect(pickupStep.itemId).toBe("item_xyz");
  });

  it("sets consume_item step with hunger need", () => {
    const job = createEatJob("char_1", { x: 0, y: 0, z: 0 }, "item_1");
    const consumeStep = job.steps[3];
    if (consumeStep.type !== "consume_item")
      throw new Error("Expected consume");
    expect(consumeStep.needId).toBe("hunger");
  });
});

describe("food nutrition values", () => {
  it("meat has nutrition 0.3", () => {
    expect(ITEM_REGISTRY.meat.nutrition).toBe(0.3);
  });

  it("meal_simple has nutrition 0.8", () => {
    expect(ITEM_REGISTRY.meal_simple.nutrition).toBe(0.8);
  });

  it("meal_fine has nutrition 1.0", () => {
    expect(ITEM_REGISTRY.meal_fine.nutrition).toBe(1.0);
  });

  it("non-food items have nutrition 0", () => {
    expect(ITEM_REGISTRY.wood.nutrition).toBe(0);
    expect(ITEM_REGISTRY.stone.nutrition).toBe(0);
    expect(ITEM_REGISTRY.pickaxe.nutrition).toBe(0);
  });
});
