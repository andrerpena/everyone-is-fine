import { describe, expect, it } from "vitest";
import type { ZoneData } from "./types";
import { ZONE_PRIORITY_LABELS } from "./types";

describe("zone priority", () => {
  it("has labels for all priority levels", () => {
    expect(ZONE_PRIORITY_LABELS[1]).toBe("Preferred");
    expect(ZONE_PRIORITY_LABELS[2]).toBe("Normal");
    expect(ZONE_PRIORITY_LABELS[3]).toBe("Low");
  });

  it("sorts stockpiles by priority ascending", () => {
    const zones: ZoneData[] = [
      {
        id: "z1",
        type: "stockpile",
        name: "Low",
        zLevel: 0,
        tiles: new Set(),
        priority: 3,
      },
      {
        id: "z2",
        type: "stockpile",
        name: "Preferred",
        zLevel: 0,
        tiles: new Set(),
        priority: 1,
      },
      {
        id: "z3",
        type: "stockpile",
        name: "Normal",
        zLevel: 0,
        tiles: new Set(),
        priority: 2,
      },
    ];

    const sorted = zones.sort((a, b) => (a.priority ?? 2) - (b.priority ?? 2));
    expect(sorted[0].name).toBe("Preferred");
    expect(sorted[1].name).toBe("Normal");
    expect(sorted[2].name).toBe("Low");
  });

  it("defaults missing priority to normal (2)", () => {
    const zones: ZoneData[] = [
      {
        id: "z1",
        type: "stockpile",
        name: "Preferred",
        zLevel: 0,
        tiles: new Set(),
        priority: 1,
      },
      {
        id: "z2",
        type: "stockpile",
        name: "No Priority",
        zLevel: 0,
        tiles: new Set(),
      },
      {
        id: "z3",
        type: "stockpile",
        name: "Low",
        zLevel: 0,
        tiles: new Set(),
        priority: 3,
      },
    ];

    const sorted = zones.sort((a, b) => (a.priority ?? 2) - (b.priority ?? 2));
    expect(sorted[0].name).toBe("Preferred");
    expect(sorted[1].name).toBe("No Priority");
    expect(sorted[2].name).toBe("Low");
  });

  it("preserves order for equal priorities", () => {
    const zones: ZoneData[] = [
      {
        id: "z1",
        type: "stockpile",
        name: "First",
        zLevel: 0,
        tiles: new Set(),
        priority: 2,
      },
      {
        id: "z2",
        type: "stockpile",
        name: "Second",
        zLevel: 0,
        tiles: new Set(),
        priority: 2,
      },
    ];

    const sorted = zones.sort((a, b) => (a.priority ?? 2) - (b.priority ?? 2));
    expect(sorted[0].name).toBe("First");
    expect(sorted[1].name).toBe("Second");
  });
});
