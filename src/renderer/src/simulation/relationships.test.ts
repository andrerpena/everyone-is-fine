import { describe, expect, it } from "vitest";
import {
  adjustOpinion,
  getOpinion,
  getRelationshipLabel,
  OPINION_MAX,
  OPINION_MIN,
  SOCIALIZE_OPINION_GAIN,
} from "./relationships";

describe("getOpinion", () => {
  it("returns 0 for unknown relationships", () => {
    expect(getOpinion({}, "unknown_id")).toBe(0);
  });

  it("returns stored opinion value", () => {
    expect(getOpinion({ char_1: 42 }, "char_1")).toBe(42);
  });
});

describe("adjustOpinion", () => {
  it("creates a new relationship with the delta", () => {
    const result = adjustOpinion({}, "char_1", 10);
    expect(result.char_1).toBe(10);
  });

  it("adds delta to existing opinion", () => {
    const result = adjustOpinion({ char_1: 20 }, "char_1", 15);
    expect(result.char_1).toBe(35);
  });

  it("clamps to OPINION_MAX", () => {
    const result = adjustOpinion({ char_1: 95 }, "char_1", 20);
    expect(result.char_1).toBe(OPINION_MAX);
  });

  it("clamps to OPINION_MIN", () => {
    const result = adjustOpinion({ char_1: -95 }, "char_1", -20);
    expect(result.char_1).toBe(OPINION_MIN);
  });

  it("handles negative deltas", () => {
    const result = adjustOpinion({ char_1: 30 }, "char_1", -10);
    expect(result.char_1).toBe(20);
  });

  it("does not mutate the original object", () => {
    const original = { char_1: 50 };
    const result = adjustOpinion(original, "char_1", 10);
    expect(original.char_1).toBe(50);
    expect(result.char_1).toBe(60);
  });

  it("preserves other relationships", () => {
    const result = adjustOpinion({ char_1: 50, char_2: -20 }, "char_1", 5);
    expect(result.char_1).toBe(55);
    expect(result.char_2).toBe(-20);
  });
});

describe("getRelationshipLabel", () => {
  it("returns 'rival' for very low opinion", () => {
    expect(getRelationshipLabel(-100)).toBe("rival");
    expect(getRelationshipLabel(-61)).toBe("rival");
  });

  it("returns 'disliked' for moderately low opinion", () => {
    expect(getRelationshipLabel(-60)).toBe("disliked");
    expect(getRelationshipLabel(-21)).toBe("disliked");
  });

  it("returns 'neutral' for near-zero opinion", () => {
    expect(getRelationshipLabel(-20)).toBe("neutral");
    expect(getRelationshipLabel(0)).toBe("neutral");
    expect(getRelationshipLabel(9)).toBe("neutral");
  });

  it("returns 'acquaintance' for slightly positive opinion", () => {
    expect(getRelationshipLabel(10)).toBe("acquaintance");
    expect(getRelationshipLabel(29)).toBe("acquaintance");
  });

  it("returns 'friend' for positive opinion", () => {
    expect(getRelationshipLabel(30)).toBe("friend");
    expect(getRelationshipLabel(59)).toBe("friend");
  });

  it("returns 'close friend' for high opinion", () => {
    expect(getRelationshipLabel(60)).toBe("close friend");
    expect(getRelationshipLabel(100)).toBe("close friend");
  });
});

describe("constants", () => {
  it("has valid opinion range", () => {
    expect(OPINION_MIN).toBe(-100);
    expect(OPINION_MAX).toBe(100);
  });

  it("has positive socialize opinion gain", () => {
    expect(SOCIALIZE_OPINION_GAIN).toBeGreaterThan(0);
  });
});
