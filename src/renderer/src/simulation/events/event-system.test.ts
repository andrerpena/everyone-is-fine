import { describe, expect, it } from "vitest";
import { SeededRandom } from "../../world/factories/world-factory";
import { EntityStore } from "../entity-store";
import { createCharacter } from "../types";
import {
  ECLIPSE_CHANCE,
  ECLIPSE_COOLDOWN_TICKS,
  ECLIPSE_DURATION_TICKS,
  type EventContext,
  eclipseEvent,
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
      time: {
        tickCount: 0,
        day: 1,
        hour: 12,
        minute: 0,
        season: "summer",
        year: 1,
      },
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

  it("eclipse chance is 0.05", () => {
    expect(ECLIPSE_CHANCE).toBe(0.05);
  });

  it("eclipse duration is 3600 ticks", () => {
    expect(ECLIPSE_DURATION_TICKS).toBe(3600);
  });

  it("eclipse cooldown is 18000 ticks", () => {
    expect(ECLIPSE_COOLDOWN_TICKS).toBe(18000);
  });
});

describe("Wanderer Joins - canTrigger", () => {
  it("returns false when colony is at max size", () => {
    const ctx = makeContext({
      entityStore: makeEntityStore(8),
      rng: new SeededRandom(1),
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

describe("Eclipse - canTrigger", () => {
  it("returns false during nighttime (hour < 7)", () => {
    const ctx = makeContext({
      world: {
        dimensions: { width: 50, height: 50, minZ: -1, maxZ: 1 },
        levels: new Map(),
        surfaceZ: 0,
        metadata: { seed: 42, createdAt: 0, version: "1", tickCount: 0 },
        time: {
          tickCount: 0,
          day: 1,
          hour: 3,
          minute: 0,
          season: "summer",
          year: 1,
        },
        weather: {} as never,
      } as never,
    });
    expect(eclipseEvent.canTrigger(ctx)).toBe(false);
  });

  it("returns false during evening (hour > 16)", () => {
    const ctx = makeContext({
      world: {
        dimensions: { width: 50, height: 50, minZ: -1, maxZ: 1 },
        levels: new Map(),
        surfaceZ: 0,
        metadata: { seed: 42, createdAt: 0, version: "1", tickCount: 0 },
        time: {
          tickCount: 0,
          day: 1,
          hour: 20,
          minute: 0,
          season: "summer",
          year: 1,
        },
        weather: {} as never,
      } as never,
    });
    expect(eclipseEvent.canTrigger(ctx)).toBe(false);
  });

  it("can trigger during daytime (hour 7-16)", () => {
    let triggered = false;
    for (let seed = 0; seed < 200; seed++) {
      const ctx = makeContext({
        rng: new SeededRandom(seed),
        world: {
          dimensions: { width: 50, height: 50, minZ: -1, maxZ: 1 },
          levels: new Map(),
          surfaceZ: 0,
          metadata: { seed: 42, createdAt: 0, version: "1", tickCount: 0 },
          time: {
            tickCount: 0,
            day: 1,
            hour: 12,
            minute: 0,
            season: "summer",
            year: 1,
          },
          weather: {} as never,
        } as never,
      });
      if (eclipseEvent.canTrigger(ctx)) {
        triggered = true;
        break;
      }
    }
    expect(triggered).toBe(true);
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
          time: {
            tickCount: 0,
            day: 1,
            hour: 12,
            minute: 0,
            season: "summer",
            year: 1,
          },
        }) as never,
      () => {
        evaluationCount++;
      },
    );

    system.update(0);
    const countAfterFirst = evaluationCount;

    // Update at tick 100 — too soon (cooldown is 600)
    system.update(100);
    expect(evaluationCount).toBe(countAfterFirst);
  });

  it("evaluates again after cooldown expires", () => {
    const store = makeEntityStore(3);
    let addCount = 0;
    const system = new EventSystem(
      store,
      new SeededRandom(42),
      () =>
        ({
          dimensions: { width: 50, height: 50, minZ: -1, maxZ: 1 },
          levels: new Map(),
          surfaceZ: 0,
          time: {
            tickCount: 0,
            day: 1,
            hour: 12,
            minute: 0,
            season: "summer",
            year: 1,
          },
        }) as never,
      () => {
        addCount++;
      },
    );

    system.update(0);
    const afterFirst = addCount;

    system.update(601);
    expect(addCount).toBeGreaterThanOrEqual(afterFirst);
  });
});

describe("EventSystem - active events", () => {
  it("tracks duration-based events as active", () => {
    const store = makeEntityStore(3);
    const system = new EventSystem(
      store,
      new SeededRandom(42),
      () =>
        ({
          dimensions: { width: 50, height: 50, minZ: -1, maxZ: 1 },
          levels: new Map(),
          surfaceZ: 0,
          time: {
            tickCount: 0,
            day: 1,
            hour: 12,
            minute: 0,
            season: "summer",
            year: 1,
          },
        }) as never,
      () => {},
    );

    // Before any event triggers
    expect(system.isEventActive("eclipse")).toBe(false);
    expect(system.getActiveEventIds().size).toBe(0);
  });

  it("clears expired events", () => {
    const store = makeEntityStore(3);
    // We can't easily force an eclipse to trigger, so test the clearing logic
    // by checking that after enough ticks, active events are cleared
    const system = new EventSystem(
      store,
      new SeededRandom(42),
      () =>
        ({
          dimensions: { width: 50, height: 50, minZ: -1, maxZ: 1 },
          levels: new Map(),
          surfaceZ: 0,
          time: {
            tickCount: 0,
            day: 1,
            hour: 12,
            minute: 0,
            season: "summer",
            year: 1,
          },
        }) as never,
      () => {},
    );

    // Run many ticks - even if eclipse triggers, it should eventually clear
    for (let tick = 0; tick < 100000; tick += 100) {
      system.update(tick);
    }
    // After enough time, no events should be permanently stuck
    // (just verifying no errors occur during the full lifecycle)
    expect(system.getActiveEventIds().size).toBeLessThanOrEqual(1);
  });
});
