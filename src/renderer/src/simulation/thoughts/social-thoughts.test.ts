import { describe, expect, it } from "vitest";
import type { Character } from "../types";
import { createCharacter } from "../types";
import {
  evaluateConditionThoughts,
  type SocialContext,
} from "./thought-system";

function makeCharacter(overrides?: Partial<Character>): Character {
  return {
    ...createCharacter({ name: "Test", position: { x: 0, y: 0, z: 0 } }),
    ...overrides,
  };
}

const socialContext3: SocialContext = { totalColonists: 3 };
const socialContext2: SocialContext = { totalColonists: 2 };

describe("social condition thoughts", () => {
  it("adds has_friends when opinion >= 30", () => {
    const c = makeCharacter({
      relationships: { other1: 30 },
    });
    const thoughts = evaluateConditionThoughts(c, undefined, socialContext3);
    expect(thoughts.has("has_friends")).toBe(true);
    expect(thoughts.has("no_friends")).toBe(false);
  });

  it("does not add has_friends when opinion < 30", () => {
    const c = makeCharacter({
      relationships: { other1: 29 },
    });
    const thoughts = evaluateConditionThoughts(c, undefined, socialContext3);
    expect(thoughts.has("has_friends")).toBe(false);
  });

  it("adds no_friends when no opinions >= 10 and >= 3 colonists", () => {
    const c = makeCharacter({
      relationships: { other1: 5, other2: -10 },
    });
    const thoughts = evaluateConditionThoughts(c, undefined, socialContext3);
    expect(thoughts.has("no_friends")).toBe(true);
  });

  it("does not add no_friends with fewer than 3 colonists", () => {
    const c = makeCharacter({
      relationships: {},
    });
    const thoughts = evaluateConditionThoughts(c, undefined, socialContext2);
    expect(thoughts.has("no_friends")).toBe(false);
  });

  it("does not add no_friends when has an acquaintance (opinion >= 10)", () => {
    const c = makeCharacter({
      relationships: { other1: 10 },
    });
    const thoughts = evaluateConditionThoughts(c, undefined, socialContext3);
    expect(thoughts.has("no_friends")).toBe(false);
  });

  it("does not add no_friends without social context", () => {
    const c = makeCharacter({
      relationships: {},
    });
    const thoughts = evaluateConditionThoughts(c);
    expect(thoughts.has("no_friends")).toBe(false);
  });

  it("adds has_rival when opinion <= -60", () => {
    const c = makeCharacter({
      relationships: { other1: -60 },
    });
    const thoughts = evaluateConditionThoughts(c, undefined, socialContext3);
    expect(thoughts.has("has_rival")).toBe(true);
  });

  it("does not add has_rival when opinion > -60", () => {
    const c = makeCharacter({
      relationships: { other1: -59 },
    });
    const thoughts = evaluateConditionThoughts(c, undefined, socialContext3);
    expect(thoughts.has("has_rival")).toBe(false);
  });

  it("can have both has_friends and has_rival simultaneously", () => {
    const c = makeCharacter({
      relationships: { friend1: 50, enemy1: -80 },
    });
    const thoughts = evaluateConditionThoughts(c, undefined, socialContext3);
    expect(thoughts.has("has_friends")).toBe(true);
    expect(thoughts.has("has_rival")).toBe(true);
    expect(thoughts.has("no_friends")).toBe(false);
  });
});
