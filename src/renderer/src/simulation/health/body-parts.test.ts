import { describe, expect, it } from "vitest";
import {
  BODY_PART_DEFINITIONS,
  BODY_PART_MAP,
  type BodyPartId,
  createDefaultBodyParts,
  getBodyPartDefinition,
  getOverallHealth,
} from "./body-parts";

describe("body part definitions", () => {
  it("defines 10 body parts", () => {
    expect(BODY_PART_DEFINITIONS).toHaveLength(10);
  });

  it("has unique IDs", () => {
    const ids = BODY_PART_DEFINITIONS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("marks head and torso as vital", () => {
    const vital = BODY_PART_DEFINITIONS.filter((d) => d.vital);
    expect(vital).toHaveLength(2);
    expect(vital.map((d) => d.id).sort()).toEqual(["head", "torso"]);
  });

  it("has valid parent references", () => {
    for (const def of BODY_PART_DEFINITIONS) {
      if (def.parent !== null) {
        expect(BODY_PART_MAP.has(def.parent)).toBe(true);
      }
    }
  });

  it("head and torso have null parent (root parts)", () => {
    expect(getBodyPartDefinition("head")?.parent).toBeNull();
    expect(getBodyPartDefinition("torso")?.parent).toBeNull();
  });

  it("hands are children of arms", () => {
    expect(getBodyPartDefinition("left_hand")?.parent).toBe("left_arm");
    expect(getBodyPartDefinition("right_hand")?.parent).toBe("right_arm");
  });

  it("feet are children of legs", () => {
    expect(getBodyPartDefinition("left_foot")?.parent).toBe("left_leg");
    expect(getBodyPartDefinition("right_foot")?.parent).toBe("right_leg");
  });
});

describe("createDefaultBodyParts", () => {
  it("creates all 10 body parts", () => {
    const parts = createDefaultBodyParts();
    expect(Object.keys(parts)).toHaveLength(10);
  });

  it("initializes all parts at full health", () => {
    const parts = createDefaultBodyParts();
    for (const def of BODY_PART_DEFINITIONS) {
      expect(parts[def.id].health).toBe(def.maxHealth);
      expect(parts[def.id].maxHealth).toBe(def.maxHealth);
    }
  });

  it("all max health values are positive", () => {
    const parts = createDefaultBodyParts();
    for (const def of BODY_PART_DEFINITIONS) {
      expect(parts[def.id].maxHealth).toBeGreaterThan(0);
    }
  });
});

describe("getOverallHealth", () => {
  it("returns 1 for full health", () => {
    const parts = createDefaultBodyParts();
    expect(getOverallHealth(parts)).toBe(1);
  });

  it("returns 0 when all parts are destroyed", () => {
    const parts = createDefaultBodyParts();
    for (const id of Object.keys(parts) as BodyPartId[]) {
      parts[id].health = 0;
    }
    expect(getOverallHealth(parts)).toBe(0);
  });

  it("returns partial value when some parts are damaged", () => {
    const parts = createDefaultBodyParts();
    // Damage head to half
    parts.head.health = parts.head.maxHealth / 2;
    const health = getOverallHealth(parts);
    expect(health).toBeGreaterThan(0);
    expect(health).toBeLessThan(1);
  });
});

describe("getBodyPartDefinition", () => {
  it("returns definition for valid ID", () => {
    const def = getBodyPartDefinition("head");
    expect(def).toBeDefined();
    expect(def?.label).toBe("Head");
  });

  it("returns undefined for invalid ID", () => {
    const def = getBodyPartDefinition("invalid" as BodyPartId);
    expect(def).toBeUndefined();
  });
});
