import { describe, expect, it } from "vitest";
import { SeededRandom } from "../../world/factories/world-factory";
import { EntityStore } from "../entity-store";
import { createCharacter } from "../types";
import type { EventContext, EventDefinition } from "./event-definitions";
import {
  GLOBAL_EVENT_COOLDOWN,
  HIGH_MOOD_THRESHOLD,
  LOW_MOOD_THRESHOLD,
  Storyteller,
} from "./storyteller";

function makeEntityStore(moods: number[]): EntityStore {
  const store = new EntityStore();
  for (let i = 0; i < moods.length; i++) {
    const char = createCharacter({
      name: `Colonist ${i}`,
      position: { x: i, y: 0, z: 0 },
    });
    char.needs.mood = moods[i];
    store.add(char);
  }
  return store;
}

function makeEvent(overrides: Partial<EventDefinition> = {}): EventDefinition {
  return {
    id: "test_event",
    label: "Test Event",
    description: "A test event",
    category: "neutral",
    cooldownTicks: 600,
    durationTicks: 0,
    canTrigger: () => true,
    execute: () => "Test executed",
    ...overrides,
  };
}

function makeContext(overrides: Partial<EventContext> = {}): EventContext {
  return {
    entityStore: makeEntityStore([0.5]),
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
    tick: 5000,
    addCharacter: () => {},
    ...overrides,
  };
}

describe("Storyteller Constants", () => {
  it("global event cooldown is 1800 ticks", () => {
    expect(GLOBAL_EVENT_COOLDOWN).toBe(1800);
  });

  it("high mood threshold is 0.7", () => {
    expect(HIGH_MOOD_THRESHOLD).toBe(0.7);
  });

  it("low mood threshold is 0.4", () => {
    expect(LOW_MOOD_THRESHOLD).toBe(0.4);
  });
});

describe("Storyteller.getAverageMood", () => {
  it("returns 0.5 for empty entity store", () => {
    const storyteller = new Storyteller();
    const store = new EntityStore();
    expect(storyteller.getAverageMood(store)).toBe(0.5);
  });

  it("computes average mood across colonists", () => {
    const storyteller = new Storyteller();
    const store = makeEntityStore([0.8, 0.6, 0.4]);
    expect(storyteller.getAverageMood(store)).toBeCloseTo(0.6, 5);
  });

  it("returns exact mood for single colonist", () => {
    const storyteller = new Storyteller();
    const store = makeEntityStore([0.3]);
    expect(storyteller.getAverageMood(store)).toBeCloseTo(0.3, 5);
  });
});

describe("Storyteller.getAllowedCategories", () => {
  it("allows all categories when mood is high", () => {
    const storyteller = new Storyteller();
    const allowed = storyteller.getAllowedCategories(0.8);
    expect(allowed.has("positive")).toBe(true);
    expect(allowed.has("negative")).toBe(true);
    expect(allowed.has("neutral")).toBe(true);
  });

  it("allows all categories when mood is medium", () => {
    const storyteller = new Storyteller();
    const allowed = storyteller.getAllowedCategories(0.5);
    expect(allowed.has("positive")).toBe(true);
    expect(allowed.has("negative")).toBe(true);
    expect(allowed.has("neutral")).toBe(true);
  });

  it("blocks negative events when mood is low", () => {
    const storyteller = new Storyteller();
    const allowed = storyteller.getAllowedCategories(0.3);
    expect(allowed.has("positive")).toBe(true);
    expect(allowed.has("neutral")).toBe(true);
    expect(allowed.has("negative")).toBe(false);
  });

  it("blocks negative events at exactly the threshold", () => {
    const storyteller = new Storyteller();
    const allowed = storyteller.getAllowedCategories(0.39);
    expect(allowed.has("negative")).toBe(false);
  });

  it("allows negative events at exactly the threshold", () => {
    const storyteller = new Storyteller();
    const allowed = storyteller.getAllowedCategories(0.4);
    expect(allowed.has("negative")).toBe(true);
  });
});

describe("Storyteller.canFireEvent", () => {
  it("can fire initially (no previous events)", () => {
    const storyteller = new Storyteller();
    expect(storyteller.canFireEvent(0)).toBe(true);
  });

  it("cannot fire immediately after an event", () => {
    const storyteller = new Storyteller();
    storyteller.recordEventFired(1000);
    expect(storyteller.canFireEvent(1001)).toBe(false);
  });

  it("can fire after global cooldown expires", () => {
    const storyteller = new Storyteller();
    storyteller.recordEventFired(1000);
    expect(storyteller.canFireEvent(1000 + GLOBAL_EVENT_COOLDOWN)).toBe(true);
  });
});

describe("Storyteller.filterByCategory", () => {
  it("filters events to allowed categories", () => {
    const storyteller = new Storyteller();
    const events = [
      makeEvent({ id: "pos", category: "positive" }),
      makeEvent({ id: "neg", category: "negative" }),
      makeEvent({ id: "neu", category: "neutral" }),
    ];

    const allowed = new Set<"positive" | "negative" | "neutral">([
      "positive",
      "neutral",
    ]);
    const filtered = storyteller.filterByCategory(events, allowed);
    expect(filtered.map((e) => e.id)).toEqual(["pos", "neu"]);
  });
});

describe("Storyteller.selectEligibleEvents", () => {
  it("returns empty when global cooldown not met", () => {
    const storyteller = new Storyteller();
    storyteller.recordEventFired(4500);

    const ctx = makeContext({ tick: 5000 });
    const events = [makeEvent()];
    expect(storyteller.selectEligibleEvents(events, ctx)).toEqual([]);
  });

  it("filters negative events when colony mood is low", () => {
    const storyteller = new Storyteller();
    const store = makeEntityStore([0.2, 0.3]);

    const events = [
      makeEvent({ id: "pos", category: "positive" }),
      makeEvent({ id: "neg", category: "negative" }),
    ];

    const ctx = makeContext({ entityStore: store, tick: 5000 });
    const eligible = storyteller.selectEligibleEvents(events, ctx);
    expect(eligible.map((e) => e.id)).toEqual(["pos"]);
  });

  it("allows all events when colony mood is high", () => {
    const storyteller = new Storyteller();
    const store = makeEntityStore([0.9, 0.8]);

    const events = [
      makeEvent({ id: "pos", category: "positive" }),
      makeEvent({ id: "neg", category: "negative" }),
    ];

    const ctx = makeContext({ entityStore: store, tick: 5000 });
    const eligible = storyteller.selectEligibleEvents(events, ctx);
    expect(eligible.map((e) => e.id)).toEqual(["pos", "neg"]);
  });
});
