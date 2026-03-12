// =============================================================================
// SOCIAL INTERACTION SYSTEM
// =============================================================================
// Tick-based system that triggers ambient social interactions when colonists
// are near each other. Restores small social need and nudges opinions.

import type { EntityStore } from "./entity-store";
import { adjustOpinion } from "./relationships";
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

// =============================================================================
// HELPERS
// =============================================================================

/** Create a consistent key for a pair of entity IDs (order-independent) */
export function pairKey(a: EntityId, b: EntityId): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
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

    // Restore social need for both
    const aNeeds = {
      ...a.needs,
      social: Math.min(1, a.needs.social + CHAT_SOCIAL_RESTORE),
    };
    const bNeeds = {
      ...b.needs,
      social: Math.min(1, b.needs.social + CHAT_SOCIAL_RESTORE),
    };

    // Adjust opinions
    const aRelationships = adjustOpinion(
      a.relationships,
      b.id,
      CHAT_OPINION_DELTA,
    );
    const bRelationships = adjustOpinion(
      b.relationships,
      a.id,
      CHAT_OPINION_DELTA,
    );

    this.entityStore.update(a.id, {
      needs: aNeeds,
      relationships: aRelationships,
    });
    this.entityStore.update(b.id, {
      needs: bNeeds,
      relationships: bRelationships,
    });
  }

  private cleanupCooldowns(): void {
    for (const [key, tick] of this.recentChats) {
      if (this.currentTick - tick >= CHAT_COOLDOWN) {
        this.recentChats.delete(key);
      }
    }
  }
}
