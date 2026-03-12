// =============================================================================
// SOCIAL INTERACTION SYSTEM
// =============================================================================
// Tick-based system that triggers ambient social interactions when colonists
// are near each other. Restores small social need and nudges opinions.

import { useLogStore } from "../lib/log-store";
import type { EntityStore } from "./entity-store";
import {
  adjustOpinion,
  canFormRomance,
  getOpinion,
  MARRIAGE_OPINION_THRESHOLD,
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

/** Base opinion adjustment per ambient chat */
export const CHAT_OPINION_DELTA = 1;

/** Extra opinion bonus when speaker has "kind" trait */
export const CHAT_KIND_BONUS = 1;

/** Opinion penalty when speaker has "abrasive" trait */
export const CHAT_ABRASIVE_PENALTY = 1;

/** Opinion bonus when speaker and listener share a trait */
export const CHAT_SHARED_TRAIT_BONUS = 1;

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

/** Both colonists must have opinion <= this for a fight to be possible */
export const FIGHT_OPINION_THRESHOLD = -50;

/** Probability of a fight per eligible pair per social check */
export const FIGHT_CHANCE = 0.04;

/** Opinion penalty applied to both participants after a fight */
export const FIGHT_OPINION_DELTA = -10;

/** Minimum ticks between fights for the same pair */
export const FIGHT_COOLDOWN = 3600;

/** Minimum ticks a partnership must last before a proposal can happen */
export const MIN_PARTNERSHIP_TICKS = 7200;

/** Probability of a marriage proposal per eligible pair per social check */
export const PROPOSAL_CHANCE = 0.02;

/** Max Manhattan distance for colonists to count as wedding attendees */
export const WEDDING_ATTENDEE_PROXIMITY = 10;

// =============================================================================
// HELPERS
// =============================================================================

/** Create a consistent key for a pair of entity IDs (order-independent) */
export function pairKey(a: EntityId, b: EntityId): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/** Calculate opinion delta for a positive chat based on speaker/listener traits */
export function getChatOpinionDelta(
  speaker: Character,
  listener: Character,
): number {
  let delta = CHAT_OPINION_DELTA;
  if (speaker.traits.includes("kind")) {
    delta += CHAT_KIND_BONUS;
  }
  if (speaker.traits.includes("abrasive")) {
    delta -= CHAT_ABRASIVE_PENALTY;
  }
  // Shared trait bonus
  if (speaker.traits.some((t) => listener.traits.includes(t))) {
    delta += CHAT_SHARED_TRAIT_BONUS;
  }
  return Math.max(0, delta);
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
  private recentFights: Map<string, number> = new Map();
  /** Tracks when partnerships formed (pairKey → tick) */
  private partnershipStartTick: Map<string, number> = new Map();
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

    // Check for social fights
    this.checkFights();

    // Check for marriage proposals among partnered colonists
    this.checkMarriageProposals();

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
    const aOpinionDelta = bInsults
      ? INSULT_OPINION_DELTA
      : getChatOpinionDelta(b, a);
    const bOpinionDelta = aInsults
      ? INSULT_OPINION_DELTA
      : getChatOpinionDelta(a, b);

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

    if (romanceFormed) {
      this.partnershipStartTick.set(pairKey(a.id, b.id), this.currentTick);
    }

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
    thoughtId:
      | "was_insulted"
      | "chatted_with_friend"
      | "chatted_with_rival"
      | "social_fight"
      | "got_married"
      | "attended_wedding",
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

    // Clear partner/spouse and add breakup thought for A
    const a = this.entityStore.get(aId);
    if (a) {
      const thoughts = a.thoughts.filter((t) => t.thoughtId !== "broke_up");
      thoughts.push(brokeUpThought);
      this.entityStore.update(aId, { partner: null, spouse: null, thoughts });
    }

    // Clear partner/spouse and add breakup thought for B
    const b = this.entityStore.get(bId);
    if (b) {
      const thoughts = b.thoughts.filter((t) => t.thoughtId !== "broke_up");
      thoughts.push(brokeUpThought);
      this.entityStore.update(bId, { partner: null, spouse: null, thoughts });
    }

    // Clean up partnership tracking
    this.partnershipStartTick.delete(pairKey(aId, bId));
  }

  private checkFights(): void {
    const characters = this.entityStore.getAll();

    for (let i = 0; i < characters.length; i++) {
      const a = characters[i];
      if (a.mentalBreak !== null) continue;

      for (let j = i + 1; j < characters.length; j++) {
        const b = characters[j];
        if (b.mentalBreak !== null) continue;

        // Must be on same z-level and within proximity
        if (a.position.z !== b.position.z) continue;
        const dist =
          Math.abs(a.position.x - b.position.x) +
          Math.abs(a.position.y - b.position.y);
        if (dist > CHAT_PROXIMITY) continue;

        // Both must have very negative opinions
        const aOpinion = getOpinion(a.relationships, b.id);
        const bOpinion = getOpinion(b.relationships, a.id);
        if (
          aOpinion > FIGHT_OPINION_THRESHOLD ||
          bOpinion > FIGHT_OPINION_THRESHOLD
        )
          continue;

        // Check fight cooldown
        const key = pairKey(a.id, b.id);
        const lastFight = this.recentFights.get(key);
        if (
          lastFight !== undefined &&
          this.currentTick - lastFight < FIGHT_COOLDOWN
        )
          continue;

        // Roll for fight
        if (Math.random() >= FIGHT_CHANCE) continue;

        this.triggerFight(a, b, key);
      }
    }
  }

  private triggerFight(a: Character, b: Character, key: string): void {
    this.recentFights.set(key, this.currentTick);

    // Drop opinions further
    const aRelationships = adjustOpinion(
      a.relationships,
      b.id,
      FIGHT_OPINION_DELTA,
    );
    const bRelationships = adjustOpinion(
      b.relationships,
      a.id,
      FIGHT_OPINION_DELTA,
    );

    // Add fight thought to both
    const aThoughts = this.addTimedThought(a.thoughts, "social_fight");
    const bThoughts = this.addTimedThought(b.thoughts, "social_fight");

    this.entityStore.update(a.id, {
      relationships: aRelationships,
      thoughts: aThoughts,
    });
    this.entityStore.update(b.id, {
      relationships: bRelationships,
      thoughts: bThoughts,
    });

    // Log the event
    useLogStore
      .getState()
      .addEntry("info", `${a.name} and ${b.name} got into a fight!`, [
        "social",
      ]);
  }

  private checkMarriageProposals(): void {
    const processed = new Set<EntityId>();

    for (const character of this.entityStore.values()) {
      if (
        character.partner === null ||
        character.spouse !== null ||
        processed.has(character.id)
      )
        continue;

      const partner = this.entityStore.get(character.partner);
      if (!partner || partner.spouse !== null) continue;

      processed.add(character.id);
      processed.add(partner.id);

      // Check mutual opinion
      const aOpinion = getOpinion(character.relationships, partner.id);
      const bOpinion = getOpinion(partner.relationships, character.id);
      if (
        aOpinion < MARRIAGE_OPINION_THRESHOLD ||
        bOpinion < MARRIAGE_OPINION_THRESHOLD
      )
        continue;

      // Check minimum partnership duration
      const key = pairKey(character.id, partner.id);
      const startTick = this.partnershipStartTick.get(key);
      if (
        startTick === undefined ||
        this.currentTick - startTick < MIN_PARTNERSHIP_TICKS
      )
        continue;

      // Roll for proposal
      if (Math.random() >= PROPOSAL_CHANCE) continue;

      this.triggerWedding(character, partner);
    }
  }

  private triggerWedding(a: Character, b: Character): void {
    // Add wedding thoughts to the couple
    const aThoughts = this.addTimedThought(a.thoughts, "got_married");
    const bThoughts = this.addTimedThought(b.thoughts, "got_married");

    this.entityStore.update(a.id, {
      spouse: b.id,
      thoughts: aThoughts,
    });
    this.entityStore.update(b.id, {
      spouse: a.id,
      thoughts: bThoughts,
    });

    // Give "attended_wedding" thought to nearby colonists
    for (const colonist of this.entityStore.values()) {
      if (colonist.id === a.id || colonist.id === b.id) continue;
      if (colonist.position.z !== a.position.z) continue;

      const dist =
        Math.abs(colonist.position.x - a.position.x) +
        Math.abs(colonist.position.y - a.position.y);
      if (dist > WEDDING_ATTENDEE_PROXIMITY) continue;

      const thoughts = this.addTimedThought(
        colonist.thoughts,
        "attended_wedding",
      );
      this.entityStore.update(colonist.id, { thoughts });
    }

    // Log the event
    useLogStore
      .getState()
      .addEntry("info", `${a.name} and ${b.name} got married!`, ["social"]);
  }

  private cleanupCooldowns(): void {
    for (const [key, tick] of this.recentChats) {
      if (this.currentTick - tick >= CHAT_COOLDOWN) {
        this.recentChats.delete(key);
      }
    }
    for (const [key, tick] of this.recentFights) {
      if (this.currentTick - tick >= FIGHT_COOLDOWN) {
        this.recentFights.delete(key);
      }
    }
  }
}
