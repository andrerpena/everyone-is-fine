// =============================================================================
// SOCIAL INTERACTION SYSTEM
// =============================================================================
// Tick-based system that triggers ambient social interactions when colonists
// are near each other. Restores small social need and nudges opinions.

import type { EntityStore } from "./entity-store";
import {
  adjustOpinion,
  canFormRomance,
  getOpinion,
  shouldBreakUp,
} from "./relationships";
import { TICKS_PER_SECOND } from "./simulation-loop";
import { THOUGHT_MAP } from "./thoughts/thought-definitions";
import type { ActiveThought } from "./thoughts/thought-system";
import type { Character, EntityId } from "./types";

// =============================================================================
// CONSTANTS
// =============================================================================

/** How often (in ticks) social interaction checks run */
export const SOCIAL_CHECK_INTERVAL = 120;

/** Maximum Manhattan distance for ambient chat */
export const CHAT_PROXIMITY = 2;

/** Probability of an ambient chat per eligible pair per check */
export const CHAT_CHANCE = 0.05;

/** Social need restored per ambient chat */
export const CHAT_SOCIAL_RESTORE = 0.05;

/** Opinion adjustment per ambient chat */
export const CHAT_OPINION_DELTA = 1;

/** Minimum ticks between chats for the same pair */
export const CHAT_COOLDOWN = 600;

/** Base probability of an insult during a chat */
export const INSULT_BASE_CHANCE = 0.1;

/** Extra insult chance for "abrasive" trait */
export const INSULT_ABRASIVE_BONUS = 0.15;

/** Reduced insult chance for "kind" trait */
export const INSULT_KIND_REDUCTION = 0.08;

/** Opinion penalty when insulted */
export const INSULT_OPINION_DELTA = -3;

// =============================================================================
// HELPERS
// =============================================================================

/** Create a consistent key for a pair of entity IDs (order-independent) */
export function pairKey(a: EntityId, b: EntityId): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/** Calculate insult chance for a character based on traits */
export function getInsultChance(character: Character): number {
  let chance = INSULT_BASE_CHANCE;
  if (character.traits.includes("abrasive")) {
    chance += INSULT_ABRASIVE_BONUS;
  }
  if (character.traits.includes("kind")) {
    chance -= INSULT_KIND_REDUCTION;
  }
  return Math.max(0, chance);
}

// =============================================================================
// SOCIAL INTERACTION SYSTEM CLASS
// =============================================================================

export class SocialInteractionSystem {
  private ticksSinceLastCheck = 0;
  private recentChats: Map<string, number> = new Map();
  private currentTick = 0;

  constructor(private entityStore: EntityStore) {}

  update(): void {
    this.currentTick++;
    this.ticksSinceLastCheck++;
    if (this.ticksSinceLastCheck < SOCIAL_CHECK_INTERVAL) return;
    this.ticksSinceLastCheck = 0;

    // Clean up expired cooldowns periodically
    this.cleanupCooldowns();

    // Check for breakups among partnered colonists
    this.checkBreakups();

    const characters = this.entityStore.getAll();
    const chatted = new Set<EntityId>();

    for (let i = 0; i < characters.length; i++) {
      const a = characters[i];
      if (!this.canChat(a) || chatted.has(a.id)) continue;

      for (let j = i + 1; j < characters.length; j++) {
        const b = characters[j];
        if (!this.canChat(b) || chatted.has(b.id)) continue;

        // Must be on same z-level and within proximity
        if (a.position.z !== b.position.z) continue;
        const dist =
          Math.abs(a.position.x - b.position.x) +
          Math.abs(a.position.y - b.position.y);
        if (dist > CHAT_PROXIMITY) continue;

        // Check cooldown
        const key = pairKey(a.id, b.id);
        const lastChat = this.recentChats.get(key);
        if (
          lastChat !== undefined &&
          this.currentTick - lastChat < CHAT_COOLDOWN
        )
          continue;

        // Roll for chat
        if (Math.random() >= CHAT_CHANCE) continue;

        // Chat happens!
        this.triggerChat(a, b, key);
        chatted.add(a.id);
        chatted.add(b.id);
        break; // Each character chats at most once per check
      }
    }
  }

  private canChat(character: Character): boolean {
    return character.mentalBreak === null;
  }

  private triggerChat(a: Character, b: Character, key: string): void {
    // Record cooldown
    this.recentChats.set(key, this.currentTick);

    // Restore social need for both (even insults count as social contact)
    const aNeeds = {
      ...a.needs,
      social: Math.min(1, a.needs.social + CHAT_SOCIAL_RESTORE),
    };
    const bNeeds = {
      ...b.needs,
      social: Math.min(1, b.needs.social + CHAT_SOCIAL_RESTORE),
    };

    // Roll for insults — each character can independently insult the other
    const aInsults = Math.random() < getInsultChance(a);
    const bInsults = Math.random() < getInsultChance(b);

    // Adjust opinions based on insult outcomes
    // If A insulted B: B's opinion of A drops. A's opinion is unchanged.
    // If neither insulted: normal positive chat for both.
    const aOpinionDelta = bInsults ? INSULT_OPINION_DELTA : CHAT_OPINION_DELTA;
    const bOpinionDelta = aInsults ? INSULT_OPINION_DELTA : CHAT_OPINION_DELTA;

    const aRelationships = adjustOpinion(a.relationships, b.id, aOpinionDelta);
    const bRelationships = adjustOpinion(b.relationships, a.id, bOpinionDelta);

    // Generate social thoughts based on post-chat opinions
    let aThoughtsUpdate = this.buildChatThoughts(
      a.thoughts,
      getOpinion(aRelationships, b.id),
    );
    let bThoughtsUpdate = this.buildChatThoughts(
      b.thoughts,
      getOpinion(bRelationships, a.id),
    );

    // Add insult thoughts to targets
    if (bInsults) {
      aThoughtsUpdate = this.addTimedThought(
        aThoughtsUpdate ?? a.thoughts,
        "was_insulted",
      );
    }
    if (aInsults) {
      bThoughtsUpdate = this.addTimedThought(
        bThoughtsUpdate ?? b.thoughts,
        "was_insulted",
      );
    }

    // Check for romance formation using updated opinions (only if no insults)
    const updatedA = { ...a, relationships: aRelationships };
    const updatedB = { ...b, relationships: bRelationships };
    const romanceFormed =
      !aInsults && !bInsults && canFormRomance(updatedA, updatedB);

    this.entityStore.update(a.id, {
      needs: aNeeds,
      relationships: aRelationships,
      ...(aThoughtsUpdate ? { thoughts: aThoughtsUpdate } : {}),
      ...(romanceFormed ? { partner: b.id } : {}),
    });
    this.entityStore.update(b.id, {
      needs: bNeeds,
      relationships: bRelationships,
      ...(bThoughtsUpdate ? { thoughts: bThoughtsUpdate } : {}),
      ...(romanceFormed ? { partner: a.id } : {}),
    });
  }

  /** Add a timed thought to a thoughts array, replacing any existing one of the same type */
  private addTimedThought(
    existingThoughts: ActiveThought[],
    thoughtId: "was_insulted" | "chatted_with_friend" | "chatted_with_rival",
  ): ActiveThought[] {
    const def = THOUGHT_MAP.get(thoughtId);
    if (!def) return existingThoughts;

    const filtered = existingThoughts.filter((t) => t.thoughtId !== thoughtId);
    const expiresAtTick =
      this.currentTick + def.durationSeconds * TICKS_PER_SECOND;
    filtered.push({
      thoughtId,
      addedAtTick: this.currentTick,
      expiresAtTick,
    });
    return filtered;
  }

  /**
   * Build updated thoughts array with a chat thought if opinion warrants it.
   * Returns null if no thought should be added.
   */
  private buildChatThoughts(
    existingThoughts: ActiveThought[],
    opinionOfPartner: number,
  ): ActiveThought[] | null {
    let thoughtId: "chatted_with_friend" | "chatted_with_rival" | null = null;
    if (opinionOfPartner >= 30) {
      thoughtId = "chatted_with_friend";
    } else if (opinionOfPartner <= -60) {
      thoughtId = "chatted_with_rival";
    }
    if (!thoughtId) return null;

    const def = THOUGHT_MAP.get(thoughtId);
    if (!def) return null;

    // Replace existing thought of the same type (reset timer) or add new
    const filtered = existingThoughts.filter((t) => t.thoughtId !== thoughtId);
    const expiresAtTick =
      this.currentTick + def.durationSeconds * TICKS_PER_SECOND;
    filtered.push({
      thoughtId,
      addedAtTick: this.currentTick,
      expiresAtTick,
    });
    return filtered;
  }

  private checkBreakups(): void {
    const processed = new Set<EntityId>();

    for (const character of this.entityStore.values()) {
      if (character.partner === null || processed.has(character.id)) continue;

      const partner = this.entityStore.get(character.partner);

      // Break up if partner no longer exists or opinion dropped too low
      const shouldEnd = !partner || shouldBreakUp(character, partner);

      if (shouldEnd) {
        this.triggerBreakup(character.id, character.partner);
        processed.add(character.id);
        processed.add(character.partner);
      }
    }
  }

  private triggerBreakup(aId: EntityId, bId: EntityId): void {
    const brokeUpDef = THOUGHT_MAP.get("broke_up");
    const expiresAtTick = brokeUpDef
      ? this.currentTick + brokeUpDef.durationSeconds * TICKS_PER_SECOND
      : this.currentTick + 172800 * TICKS_PER_SECOND;

    const brokeUpThought: ActiveThought = {
      thoughtId: "broke_up",
      addedAtTick: this.currentTick,
      expiresAtTick,
    };

    // Clear partner and add breakup thought for A
    const a = this.entityStore.get(aId);
    if (a) {
      const thoughts = a.thoughts.filter((t) => t.thoughtId !== "broke_up");
      thoughts.push(brokeUpThought);
      this.entityStore.update(aId, { partner: null, thoughts });
    }

    // Clear partner and add breakup thought for B
    const b = this.entityStore.get(bId);
    if (b) {
      const thoughts = b.thoughts.filter((t) => t.thoughtId !== "broke_up");
      thoughts.push(brokeUpThought);
      this.entityStore.update(bId, { partner: null, thoughts });
    }
  }

  private cleanupCooldowns(): void {
    for (const [key, tick] of this.recentChats) {
      if (this.currentTick - tick >= CHAT_COOLDOWN) {
        this.recentChats.delete(key);
      }
    }
  }
}
