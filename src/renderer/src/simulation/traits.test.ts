import { describe, expect, it } from "vitest";
import { SeededRandom } from "../world/factories/world-factory";
import {
  ALL_TRAIT_IDS,
  formatTraitsSummary,
  generateRandomTraits,
  getTraitDefinition,
  hasConflict,
  TRAIT_DEFINITIONS,
} from "./traits";

function createTestRng(seed = 42) {
  return new SeededRandom(seed);
}

describe("TRAIT_DEFINITIONS", () => {
  it("has 15 trait definitions", () => {
    expect(TRAIT_DEFINITIONS).toHaveLength(15);
  });

  it("all traits have unique IDs", () => {
    const ids = TRAIT_DEFINITIONS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("conflict relationships are symmetric", () => {
    for (const def of TRAIT_DEFINITIONS) {
      for (const conflictId of def.conflictsWith) {
        const conflictDef = TRAIT_DEFINITIONS.find((d) => d.id === conflictId);
        expect(
          conflictDef?.conflictsWith,
          `${conflictId} should conflict with ${def.id}`,
        ).toContain(def.id);
      }
    }
  });
});

describe("hasConflict", () => {
  it("returns false for non-conflicting traits", () => {
    expect(hasConflict(["brave", "nimble"], "industrious")).toBe(false);
  });

  it("returns true for conflicting traits", () => {
    expect(hasConflict(["industrious"], "lazy")).toBe(true);
    expect(hasConflict(["lazy"], "industrious")).toBe(true);
  });

  it("returns true for duplicate traits", () => {
    expect(hasConflict(["brave"], "brave")).toBe(true);
  });

  it("returns false for empty trait list", () => {
    expect(hasConflict([], "brave")).toBe(false);
  });
});

describe("generateRandomTraits", () => {
  it("generates 2-4 traits", () => {
    for (let seed = 0; seed < 20; seed++) {
      const rng = createTestRng(seed);
      const traits = generateRandomTraits(rng);
      expect(traits.length).toBeGreaterThanOrEqual(2);
      expect(traits.length).toBeLessThanOrEqual(4);
    }
  });

  it("generates no conflicting traits", () => {
    for (let seed = 0; seed < 20; seed++) {
      const rng = createTestRng(seed);
      const traits = generateRandomTraits(rng);

      for (let i = 0; i < traits.length; i++) {
        const def = getTraitDefinition(traits[i]);
        for (let j = i + 1; j < traits.length; j++) {
          expect(
            def?.conflictsWith,
            `${traits[i]} should not conflict with ${traits[j]}`,
          ).not.toContain(traits[j]);
        }
      }
    }
  });

  it("generates no duplicate traits", () => {
    for (let seed = 0; seed < 20; seed++) {
      const rng = createTestRng(seed);
      const traits = generateRandomTraits(rng);
      expect(new Set(traits).size).toBe(traits.length);
    }
  });

  it("only contains valid trait IDs", () => {
    const rng = createTestRng();
    const traits = generateRandomTraits(rng);
    for (const trait of traits) {
      expect(ALL_TRAIT_IDS).toContain(trait);
    }
  });
});

describe("getTraitDefinition", () => {
  it("returns definition for valid trait", () => {
    const def = getTraitDefinition("brave");
    expect(def?.label).toBe("Brave");
  });
});

describe("formatTraitsSummary", () => {
  it("returns 'None' for empty traits", () => {
    expect(formatTraitsSummary([])).toBe("None");
  });

  it("formats single trait", () => {
    expect(formatTraitsSummary(["brave"])).toBe("Brave");
  });

  it("formats multiple traits with commas", () => {
    expect(formatTraitsSummary(["brave", "nimble"])).toBe("Brave, Nimble");
  });
});
