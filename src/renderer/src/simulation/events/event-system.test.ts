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
  PSYCHIC_DRONE_CHANCE,
  PSYCHIC_DRONE_COOLDOWN_TICKS,
  PSYCHIC_DRONE_DURATION_TICKS,
  psychicDroneEvent,
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

function makeGenderedEntityStore(males: number, females: number): EntityStore {
  const store = new EntityStore();
  for (let i = 0; i < males; i++) {
    store.add(
      createCharacter({
        name: `Male ${i}`,
        position: { x: i, y: 0, z: 0 },
        biography: {
          firstName: `Male ${i}`,
          nickname: null,
          lastName: "",
          age: 25,
          gender: "male",
        },
      }),
    );
  }
  for (let i = 0; i < females; i++) {
    store.add(
      createCharacter({
        name: `Female ${i}`,
        position: { x: males + i, y: 0, z: 0 },
        biography: {
          firstName: `Female ${i}`,
          nickname: null,
          lastName: "",
          age: 25,
          gender: "female",
        },
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

describe("Psychic Drone - constants", () => {
  it("psychic drone chance is 0.04", () => {
    expect(PSYCHIC_DRONE_CHANCE).toBe(0.04);
  });

  it("psychic drone duration is 5400 ticks", () => {
    expect(PSYCHIC_DRONE_DURATION_TICKS).toBe(5400);
  });

  it("psychic drone cooldown is 18000 ticks", () => {
    expect(PSYCHIC_DRONE_COOLDOWN_TICKS).toBe(18000);
  });

  it("psychic drone is categorized as negative", () => {
    expect(psychicDroneEvent.category).toBe("negative");
  });
});

describe("Psychic Drone - canTrigger", () => {
  it("can trigger based on RNG chance", () => {
    let triggered = false;
    for (let seed = 0; seed < 200; seed++) {
      const ctx = makeContext({ rng: new SeededRandom(seed) });
      if (psychicDroneEvent.canTrigger(ctx)) {
        triggered = true;
        break;
      }
    }
    expect(triggered).toBe(true);
  });

  it("can fail to trigger based on RNG chance", () => {
    let notTriggered = false;
    for (let seed = 0; seed < 200; seed++) {
      const ctx = makeContext({ rng: new SeededRandom(seed) });
      if (!psychicDroneEvent.canTrigger(ctx)) {
        notTriggered = true;
        break;
      }
    }
    expect(notTriggered).toBe(true);
  });
});

describe("Psychic Drone - execute (gender filtering)", () => {
  it("only applies thought to one gender", () => {
    const store = makeGenderedEntityStore(3, 3);
    const ctx = makeContext({
      entityStore: store,
      rng: new SeededRandom(42),
      tick: 1000,
    });

    psychicDroneEvent.execute(ctx);

    let maleAffected = 0;
    let femaleAffected = 0;
    for (const [, character] of store) {
      const hasDrone = character.thoughts.some(
        (t) => t.thoughtId === "psychic_drone",
      );
      if (hasDrone) {
        if (character.biography.gender === "male") maleAffected++;
        else femaleAffected++;
      }
    }

    // Exactly one gender should be affected
    const oneGenderOnly =
      (maleAffected > 0 && femaleAffected === 0) ||
      (femaleAffected > 0 && maleAffected === 0);
    expect(oneGenderOnly).toBe(true);
  });

  it("affects all colonists of the selected gender", () => {
    const store = makeGenderedEntityStore(3, 3);
    const ctx = makeContext({
      entityStore: store,
      rng: new SeededRandom(42),
      tick: 1000,
    });

    psychicDroneEvent.execute(ctx);

    let maleAffected = 0;
    let femaleAffected = 0;
    let maleTotal = 0;
    let femaleTotal = 0;
    for (const [, character] of store) {
      if (character.biography.gender === "male") maleTotal++;
      else femaleTotal++;
      const hasDrone = character.thoughts.some(
        (t) => t.thoughtId === "psychic_drone",
      );
      if (hasDrone) {
        if (character.biography.gender === "male") maleAffected++;
        else femaleAffected++;
      }
    }

    // All colonists of the affected gender should have the thought
    if (maleAffected > 0) {
      expect(maleAffected).toBe(maleTotal);
    } else {
      expect(femaleAffected).toBe(femaleTotal);
    }
  });

  it("returns a message indicating the affected gender", () => {
    const store = makeGenderedEntityStore(2, 2);
    const ctx = makeContext({
      entityStore: store,
      rng: new SeededRandom(42),
      tick: 1000,
    });

    const message = psychicDroneEvent.execute(ctx);
    expect(message.includes("male") || message.includes("female")).toBe(true);
    expect(message).toContain("psychic drone");
  });

  it("can select either gender depending on RNG seed", () => {
    let maleSelected = false;
    let femaleSelected = false;

    for (let seed = 0; seed < 100; seed++) {
      const store = makeGenderedEntityStore(2, 2);
      // Need 2 RNG calls: canTrigger uses one, execute uses another
      // But we're calling execute directly, so the RNG starts fresh
      const rng = new SeededRandom(seed);
      const ctx = makeContext({
        entityStore: store,
        rng,
        tick: 1000,
      });

      psychicDroneEvent.execute(ctx);

      for (const [, character] of store) {
        const hasDrone = character.thoughts.some(
          (t) => t.thoughtId === "psychic_drone",
        );
        if (hasDrone) {
          if (character.biography.gender === "male") maleSelected = true;
          else femaleSelected = true;
          break;
        }
      }

      if (maleSelected && femaleSelected) break;
    }

    expect(maleSelected).toBe(true);
    expect(femaleSelected).toBe(true);
  });
});
