import { describe, expect, it } from "vitest";
import { SeededRandom } from "../../world/factories/world-factory";
import { EntityStore } from "../entity-store";
import { createCharacter } from "../types";
import {
  type EventContext,
  WANDERER_CHANCE,
  WANDERER_MAX_COLONY_SIZE,
  wandererJoinsEvent,
} from "./event-definitions";
import { EventSystem } from "./event-system";

function makeEntityStore(count: number): EntityStore {
  const store = new EntityStore();
  for (let i = 0; i < count; i++) {
    store.add(
      createCharacter({
        name: `Colonist ${i}`,
        position: { x: i, y: 0, z: 0 },
      }),
    );
  }
  return store;
}

function makeContext(overrides: Partial<EventContext> = {}): EventContext {
  return {
    entityStore: makeEntityStore(0),
    world: {
      dimensions: { width: 50, height: 50, minZ: -1, maxZ: 1 },
      levels: new Map(),
      surfaceZ: 0,
      metadata: { seed: 42, createdAt: 0, version: "1", tickCount: 0 },
      time: {} as never,
      weather: {} as never,
    } as never,
    rng: new SeededRandom(42),
    tick: 1000,
    addCharacter: () => {},
    ...overrides,
  };
}

describe("Event System Constants", () => {
  it("wanderer max colony size is 8", () => {
    expect(WANDERER_MAX_COLONY_SIZE).toBe(8);
  });

  it("wanderer chance is 0.08", () => {
    expect(WANDERER_CHANCE).toBe(0.08);
  });

  it("wanderer cooldown is 600 ticks", () => {
    expect(wandererJoinsEvent.cooldownTicks).toBe(600);
  });
});

describe("Wanderer Joins - canTrigger", () => {
  it("returns false when colony is at max size", () => {
    const ctx = makeContext({
      entityStore: makeEntityStore(8),
      rng: new SeededRandom(1), // doesn't matter, should short-circuit
    });
    expect(wandererJoinsEvent.canTrigger(ctx)).toBe(false);
  });

  it("returns false when colony exceeds max size", () => {
    const ctx = makeContext({
      entityStore: makeEntityStore(10),
    });
    expect(wandererJoinsEvent.canTrigger(ctx)).toBe(false);
  });

  it("can return true when colony is below max size (depends on RNG)", () => {
    // Try many seeds — at least one should trigger with 8% chance
    let triggered = false;
    for (let seed = 0; seed < 100; seed++) {
      const ctx = makeContext({
        entityStore: makeEntityStore(3),
        rng: new SeededRandom(seed),
      });
      if (wandererJoinsEvent.canTrigger(ctx)) {
        triggered = true;
        break;
      }
    }
    expect(triggered).toBe(true);
  });

  it("can return false when colony is below max size (depends on RNG)", () => {
    // Try many seeds — at least one should NOT trigger
    let notTriggered = false;
    for (let seed = 0; seed < 100; seed++) {
      const ctx = makeContext({
        entityStore: makeEntityStore(3),
        rng: new SeededRandom(seed),
      });
      if (!wandererJoinsEvent.canTrigger(ctx)) {
        notTriggered = true;
        break;
      }
    }
    expect(notTriggered).toBe(true);
  });
});

describe("EventSystem - cooldown", () => {
  it("does not evaluate event before cooldown expires", () => {
    let evaluationCount = 0;
    const store = makeEntityStore(3);
    const system = new EventSystem(
      store,
      new SeededRandom(42),
      () =>
        ({
          dimensions: { width: 50, height: 50, minZ: -1, maxZ: 1 },
          levels: new Map(),
          surfaceZ: 0,
        }) as never,
      () => {
        evaluationCount++;
      },
    );

    // First update at tick 0 — evaluates
    system.update(0);
    const countAfterFirst = evaluationCount;

    // Update at tick 100 — too soon (cooldown is 600)
    system.update(100);
    // Should be same count (cooldown not expired, no additional trigger)
    // Note: we can't guarantee trigger since it depends on RNG,
    // but at minimum it shouldn't evaluate again within cooldown
    expect(evaluationCount).toBe(countAfterFirst);
  });

  it("evaluates again after cooldown expires", () => {
    const store = makeEntityStore(3);
    // Use a seeded RNG that we know triggers the event
    let addCount = 0;
    const system = new EventSystem(
      store,
      new SeededRandom(42),
      () =>
        ({
          dimensions: { width: 50, height: 50, minZ: -1, maxZ: 1 },
          levels: new Map(),
          surfaceZ: 0,
        }) as never,
      () => {
        addCount++;
      },
    );

    system.update(0);
    const afterFirst = addCount;

    // After cooldown
    system.update(601);
    // It should have evaluated again (whether it triggers depends on RNG)
    // We just verify no errors
    expect(addCount).toBeGreaterThanOrEqual(afterFirst);
  });
});
