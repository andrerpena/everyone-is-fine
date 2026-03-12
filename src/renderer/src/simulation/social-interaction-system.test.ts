import { describe, expect, it } from "vitest";
import {
  CHAT_CHANCE,
  CHAT_COOLDOWN,
  CHAT_OPINION_DELTA,
  CHAT_PROXIMITY,
  CHAT_SOCIAL_RESTORE,
  pairKey,
  SOCIAL_CHECK_INTERVAL,
} from "./social-interaction-system";

describe("social interaction constants", () => {
  it("has a reasonable check interval", () => {
    expect(SOCIAL_CHECK_INTERVAL).toBeGreaterThan(0);
    expect(SOCIAL_CHECK_INTERVAL).toBeLessThanOrEqual(300);
  });

  it("has a small chat chance", () => {
    expect(CHAT_CHANCE).toBeGreaterThan(0);
    expect(CHAT_CHANCE).toBeLessThanOrEqual(0.2);
  });

  it("has positive proximity", () => {
    expect(CHAT_PROXIMITY).toBeGreaterThan(0);
  });

  it("has positive social restore amount", () => {
    expect(CHAT_SOCIAL_RESTORE).toBeGreaterThan(0);
    expect(CHAT_SOCIAL_RESTORE).toBeLessThanOrEqual(0.2);
  });

  it("has positive opinion delta", () => {
    expect(CHAT_OPINION_DELTA).toBeGreaterThan(0);
  });

  it("has positive cooldown", () => {
    expect(CHAT_COOLDOWN).toBeGreaterThan(0);
  });
});

describe("pairKey", () => {
  it("creates consistent key regardless of order", () => {
    expect(pairKey("char_a", "char_b")).toBe(pairKey("char_b", "char_a"));
  });

  it("creates different keys for different pairs", () => {
    expect(pairKey("char_a", "char_b")).not.toBe(pairKey("char_a", "char_c"));
  });

  it("uses pipe separator", () => {
    const key = pairKey("a", "b");
    expect(key).toContain("|");
  });
});
