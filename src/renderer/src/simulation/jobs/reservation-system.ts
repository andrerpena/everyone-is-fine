// =============================================================================
// RESERVATION SYSTEM - Prevents multiple colonists from claiming the same tile
// =============================================================================

import type { Position3D } from "../../world/types";
import type { EntityId } from "../types";
import { positionToKey } from "../types";

/**
 * Tracks which tiles are reserved by which entity.
 * Used by the JobProcessor to prevent multiple colonists from targeting
 * the same resource (bush, tree, boulder, etc.).
 */
export class ReservationSystem {
  /** Map from position key → entity ID that reserved it */
  private reservations: Map<string, EntityId> = new Map();

  /** Reserve a tile for an entity. Returns true if reservation succeeded. */
  reserve(position: Position3D, entityId: EntityId): boolean {
    const key = positionToKey(position);
    const existing = this.reservations.get(key);

    // Already reserved by same entity — that's fine
    if (existing === entityId) return true;

    // Reserved by someone else — cannot claim
    if (existing !== undefined) return false;

    this.reservations.set(key, entityId);
    return true;
  }

  /** Release a reservation for a position. */
  release(position: Position3D): void {
    this.reservations.delete(positionToKey(position));
  }

  /** Release all reservations held by a specific entity. */
  releaseAllForEntity(entityId: EntityId): void {
    for (const [key, reservedBy] of this.reservations) {
      if (reservedBy === entityId) {
        this.reservations.delete(key);
      }
    }
  }

  /** Check if a position is reserved by any entity. */
  isReserved(position: Position3D): boolean {
    return this.reservations.has(positionToKey(position));
  }

  /** Check if a position is reserved by a specific entity. */
  isReservedBy(position: Position3D, entityId: EntityId): boolean {
    return this.reservations.get(positionToKey(position)) === entityId;
  }
}
