import { describe, expect, it } from "vitest";
import {
  CHAT_ABRASIVE_PENALTY,
  CHAT_KIND_BONUS,
  CHAT_OPINION_DELTA,
  CHAT_SHARED_TRAIT_BONUS,
  getChatOpinionDelta,
} from "./social-interaction-system";
import type { Character } from "./types";
import { createCharacter } from "./types";

function makeCharacter(overrides?: Partial<Character>): Character {
  return {
    ...createCharacter({ name: "Test", position: { x: 0, y: 0, z: 0 } }),
    ...overrides,
  };
}

describe("getChatOpinionDelta", () => {
  it("returns base delta for characters with no relevant traits", () => {
    const speaker = makeCharacter({ traits: [] });
    const listener = makeCharacter({ traits: [] });
    expect(getChatOpinionDelta(speaker, listener)).toBe(CHAT_OPINION_DELTA);
  });

  it("adds bonus when speaker has kind trait", () => {
    const speaker = makeCharacter({ traits: ["kind"] });
    const listener = makeCharacter({ traits: [] });
    expect(getChatOpinionDelta(speaker, listener)).toBe(
      CHAT_OPINION_DELTA + CHAT_KIND_BONUS,
    );
  });

  it("subtracts penalty when speaker has abrasive trait", () => {
    const speaker = makeCharacter({ traits: ["abrasive"] });
    const listener = makeCharacter({ traits: [] });
    expect(getChatOpinionDelta(speaker, listener)).toBe(
      CHAT_OPINION_DELTA - CHAT_ABRASIVE_PENALTY,
    );
  });

  it("floors at 0 (never returns negative)", () => {
    // Abrasive with no other bonuses: 1 - 1 = 0
    const speaker = makeCharacter({ traits: ["abrasive"] });
    const listener = makeCharacter({ traits: [] });
    expect(getChatOpinionDelta(speaker, listener)).toBeGreaterThanOrEqual(0);
  });

  it("adds bonus when speaker and listener share a trait", () => {
    const speaker = makeCharacter({ traits: ["brave"] });
    const listener = makeCharacter({ traits: ["brave"] });
    expect(getChatOpinionDelta(speaker, listener)).toBe(
      CHAT_OPINION_DELTA + CHAT_SHARED_TRAIT_BONUS,
    );
  });

  it("combines kind bonus with shared trait bonus", () => {
    const speaker = makeCharacter({ traits: ["kind", "brave"] });
    const listener = makeCharacter({ traits: ["brave"] });
    expect(getChatOpinionDelta(speaker, listener)).toBe(
      CHAT_OPINION_DELTA + CHAT_KIND_BONUS + CHAT_SHARED_TRAIT_BONUS,
    );
  });

  it("abrasive penalty offset by shared trait bonus", () => {
    const speaker = makeCharacter({ traits: ["abrasive", "brave"] });
    const listener = makeCharacter({ traits: ["brave"] });
    // 1 - 1 + 1 = 1
    expect(getChatOpinionDelta(speaker, listener)).toBe(
      CHAT_OPINION_DELTA - CHAT_ABRASIVE_PENALTY + CHAT_SHARED_TRAIT_BONUS,
    );
  });

  it("shared trait bonus only applies once even with multiple shared traits", () => {
    const speaker = makeCharacter({ traits: ["brave", "optimist"] });
    const listener = makeCharacter({ traits: ["brave", "optimist"] });
    // .some() returns true on first match, so only +1 bonus
    expect(getChatOpinionDelta(speaker, listener)).toBe(
      CHAT_OPINION_DELTA + CHAT_SHARED_TRAIT_BONUS,
    );
  });

  it("is asymmetric — speaker traits matter, not listener traits", () => {
    const kind = makeCharacter({ traits: ["kind"] });
    const plain = makeCharacter({ traits: [] });
    // Kind speaking to plain gets bonus
    const kindSpeaking = getChatOpinionDelta(kind, plain);
    // Plain speaking to kind gets no bonus
    const plainSpeaking = getChatOpinionDelta(plain, kind);
    expect(kindSpeaking).toBeGreaterThan(plainSpeaking);
  });
});
