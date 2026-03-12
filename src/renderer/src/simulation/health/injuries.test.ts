import { describe, expect, it } from "vitest";
import { createDefaultBodyParts, getOverallHealth } from "./body-parts";
import {
  applyInjury,
  getInjuryDefinition,
  INJURY_DEFINITIONS,
  INJURY_MAP,
  type InjuryTypeId,
  naturalHealing,
} from "./injuries";

describe("injury definitions", () => {
  it("defines 7 injury types", () => {
    expect(INJURY_DEFINITIONS).toHaveLength(7);
  });

  it("has unique IDs", () => {
    const ids = INJURY_DEFINITIONS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all have positive base damage", () => {
    for (const def of INJURY_DEFINITIONS) {
      expect(def.baseDamage).toBeGreaterThan(0);
    }
  });

  it("all have positive heal rates", () => {
    for (const def of INJURY_DEFINITIONS) {
      expect(def.healRatePerTick).toBeGreaterThan(0);
    }
  });
});

describe("getInjuryDefinition", () => {
  it("returns definition for valid ID", () => {
    const def = getInjuryDefinition("cut");
    expect(def).toBeDefined();
    expect(def?.label).toBe("Cut");
  });

  it("returns undefined for invalid ID", () => {
    expect(getInjuryDefinition("invalid" as InjuryTypeId)).toBeUndefined();
  });
});

describe("applyInjury", () => {
  it("reduces body part health by base damage", () => {
    const parts = createDefaultBodyParts();
    const initialHealth = parts.head.health;
    const cutDamage = INJURY_MAP.get("cut")!.baseDamage;

    applyInjury(parts, "head", "cut");

    expect(parts.head.health).toBe(initialHealth - cutDamage);
  });

  it("adds injury to body part injuries list", () => {
    const parts = createDefaultBodyParts();
    expect(parts.torso.injuries).toHaveLength(0);

    const injury = applyInjury(parts, "torso", "bruise");

    expect(parts.torso.injuries).toHaveLength(1);
    expect(parts.torso.injuries[0]).toBe(injury);
    expect(injury.typeId).toBe("bruise");
    expect(injury.bodyPartId).toBe("torso");
    expect(injury.healProgress).toBe(0);
  });

  it("clamps health to 0 minimum", () => {
    const parts = createDefaultBodyParts();
    // Apply many gunshots to ensure health would go negative
    for (let i = 0; i < 10; i++) {
      applyInjury(parts, "left_hand", "gunshot");
    }
    expect(parts.left_hand.health).toBe(0);
  });

  it("reduces overall health", () => {
    const parts = createDefaultBodyParts();
    expect(getOverallHealth(parts)).toBe(1);

    applyInjury(parts, "torso", "gunshot");

    expect(getOverallHealth(parts)).toBeLessThan(1);
  });

  it("creates unique injury IDs", () => {
    const parts = createDefaultBodyParts();
    const inj1 = applyInjury(parts, "head", "cut");
    const inj2 = applyInjury(parts, "head", "cut");
    expect(inj1.id).not.toBe(inj2.id);
  });

  it("throws for unknown injury type", () => {
    const parts = createDefaultBodyParts();
    expect(() => applyInjury(parts, "head", "unknown" as InjuryTypeId)).toThrow(
      "Unknown injury type",
    );
  });
});

describe("naturalHealing", () => {
  it("advances heal progress over time", () => {
    const parts = createDefaultBodyParts();
    applyInjury(parts, "head", "scratch");

    naturalHealing(parts, 100);

    expect(parts.head.injuries[0].healProgress).toBeGreaterThan(0);
    expect(parts.head.injuries[0].healProgress).toBeLessThan(1);
  });

  it("removes fully healed injuries", () => {
    const parts = createDefaultBodyParts();
    applyInjury(parts, "head", "scratch");
    const scratchHealRate = INJURY_MAP.get("scratch")!.healRatePerTick;

    // Apply enough ticks to fully heal
    const ticksToHeal = Math.ceil(1 / scratchHealRate);
    naturalHealing(parts, ticksToHeal);

    expect(parts.head.injuries).toHaveLength(0);
  });

  it("restores health when injury heals", () => {
    const parts = createDefaultBodyParts();
    const initialHealth = parts.head.health;
    applyInjury(parts, "head", "scratch");
    const damagedHealth = parts.head.health;
    expect(damagedHealth).toBeLessThan(initialHealth);

    // Fully heal
    const scratchHealRate = INJURY_MAP.get("scratch")!.healRatePerTick;
    const ticksToHeal = Math.ceil(1 / scratchHealRate);
    naturalHealing(parts, ticksToHeal);

    expect(parts.head.health).toBe(initialHealth);
  });

  it("does not exceed max health when healing", () => {
    const parts = createDefaultBodyParts();
    applyInjury(parts, "torso", "bruise");

    // Heal fully
    const healRate = INJURY_MAP.get("bruise")!.healRatePerTick;
    naturalHealing(parts, Math.ceil(1 / healRate));

    expect(parts.torso.health).toBeLessThanOrEqual(parts.torso.maxHealth);
  });

  it("heals multiple injuries independently", () => {
    const parts = createDefaultBodyParts();
    applyInjury(parts, "left_arm", "scratch");
    applyInjury(parts, "left_arm", "gunshot");

    // Heal enough for scratch but not gunshot
    const scratchRate = INJURY_MAP.get("scratch")!.healRatePerTick;
    const ticksForScratch = Math.ceil(1 / scratchRate);
    naturalHealing(parts, ticksForScratch);

    // Scratch should be healed, gunshot still present
    expect(parts.left_arm.injuries).toHaveLength(1);
    expect(parts.left_arm.injuries[0].typeId).toBe("gunshot");
  });

  it("does nothing when no injuries exist", () => {
    const parts = createDefaultBodyParts();
    const healthBefore = parts.head.health;

    naturalHealing(parts, 1000);

    expect(parts.head.health).toBe(healthBefore);
    expect(parts.head.injuries).toHaveLength(0);
  });
});
