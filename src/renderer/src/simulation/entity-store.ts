// =============================================================================
// ENTITY STORE
// =============================================================================
// Manages entity storage with efficient spatial indexing for O(1) lookups

import type { Position3D } from "../world/types";
import type { Character, EntityId } from "./types";
import { positionToKey } from "./types";

// =============================================================================
// ENTITY STORE CLASS
// =============================================================================

/**
 * Entity store with spatial indexing.
 * Provides O(1) lookups by ID and by tile position.
 */
export class EntityStore {
  /** Characters indexed by ID */
  private characters: Map<EntityId, Character> = new Map();

  /** Spatial index: "x,y,z" -> Set of entity IDs */
  private spatialIndex: Map<string, Set<EntityId>> = new Map();

  // ===========================================================================
  // CHARACTER CRUD
  // ===========================================================================

  /** Add a character to the store */
  add(character: Character): void {
    // Prevent duplicates
    if (this.characters.has(character.id)) {
      console.warn(
        `Character ${character.id} already exists, updating instead`,
      );
      this.update(character.id, character);
      return;
    }

    // Add to main storage
    this.characters.set(character.id, character);

    // Add to spatial index
    this.addToSpatialIndex(character.id, character.position);
  }

  /** Remove a character from the store */
  remove(id: EntityId): boolean {
    const character = this.characters.get(id);
    if (!character) {
      return false;
    }

    // Remove from spatial index
    this.removeFromSpatialIndex(id, character.position);

    // Remove from main storage
    this.characters.delete(id);

    return true;
  }

  /** Get a character by ID */
  get(id: EntityId): Character | undefined {
    return this.characters.get(id);
  }

  /** Check if a character exists */
  has(id: EntityId): boolean {
    return this.characters.has(id);
  }

  /** Update a character (partial update) */
  update(id: EntityId, changes: Partial<Character>): boolean {
    const character = this.characters.get(id);
    if (!character) {
      return false;
    }

    // If position is changing, update spatial index
    if (
      changes.position &&
      !this.positionsEqual(character.position, changes.position)
    ) {
      this.removeFromSpatialIndex(id, character.position);
      this.addToSpatialIndex(id, changes.position);
    }

    // Merge changes into character
    const updatedCharacter = this.mergeCharacter(character, changes);
    this.characters.set(id, updatedCharacter);

    return true;
  }

  /** Get all characters */
  getAll(): Character[] {
    return Array.from(this.characters.values());
  }

  /** Get all character IDs */
  getAllIds(): EntityId[] {
    return Array.from(this.characters.keys());
  }

  /** Get the number of characters */
  get size(): number {
    return this.characters.size;
  }

  /** Clear all characters */
  clear(): void {
    this.characters.clear();
    this.spatialIndex.clear();
  }

  // ===========================================================================
  // SPATIAL QUERIES
  // ===========================================================================

  /** Get characters at a specific tile position */
  getAtTile(position: Position3D): Character[] {
    const key = positionToKey(position);
    const ids = this.spatialIndex.get(key);

    if (!ids || ids.size === 0) {
      return [];
    }

    const characters: Character[] = [];
    for (const id of ids) {
      const character = this.characters.get(id);
      if (character) {
        characters.push(character);
      }
    }

    return characters;
  }

  /** Get character IDs at a specific tile position */
  getIdsAtTile(position: Position3D): Set<EntityId> {
    const key = positionToKey(position);
    return this.spatialIndex.get(key) ?? new Set();
  }

  /** Check if there are any characters at a tile */
  hasCharactersAtTile(position: Position3D): boolean {
    const key = positionToKey(position);
    const ids = this.spatialIndex.get(key);
    return ids !== undefined && ids.size > 0;
  }

  /** Get characters within a radius (Manhattan distance) */
  getInRadius(center: Position3D, radius: number): Character[] {
    const results: Character[] = [];

    for (const character of this.characters.values()) {
      const distance =
        Math.abs(character.position.x - center.x) +
        Math.abs(character.position.y - center.y) +
        Math.abs(character.position.z - center.z);

      if (distance <= radius) {
        results.push(character);
      }
    }

    return results;
  }

  /** Get characters on a specific z-level */
  getOnZLevel(z: number): Character[] {
    const results: Character[] = [];

    for (const character of this.characters.values()) {
      if (character.position.z === z) {
        results.push(character);
      }
    }

    return results;
  }

  // ===========================================================================
  // ITERATION
  // ===========================================================================

  /** Iterate over all characters */
  forEach(callback: (character: Character, id: EntityId) => void): void {
    this.characters.forEach((character, id) => {
      callback(character, id);
    });
  }

  /** Get characters as iterable */
  [Symbol.iterator](): IterableIterator<[EntityId, Character]> {
    return this.characters.entries();
  }

  /** Get values iterator */
  values(): IterableIterator<Character> {
    return this.characters.values();
  }

  // ===========================================================================
  // SERIALIZATION
  // ===========================================================================

  /** Export characters for serialization */
  toJSON(): Character[] {
    return this.getAll();
  }

  /** Import characters from serialized data */
  fromJSON(characters: Character[]): void {
    this.clear();
    for (const character of characters) {
      this.add(character);
    }
  }

  /** Clone the store (shallow copy of characters) */
  clone(): EntityStore {
    const cloned = new EntityStore();
    for (const character of this.characters.values()) {
      cloned.add({ ...character });
    }
    return cloned;
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  /** Add entity to spatial index */
  private addToSpatialIndex(id: EntityId, position: Position3D): void {
    const key = positionToKey(position);
    let ids = this.spatialIndex.get(key);

    if (!ids) {
      ids = new Set();
      this.spatialIndex.set(key, ids);
    }

    ids.add(id);
  }

  /** Remove entity from spatial index */
  private removeFromSpatialIndex(id: EntityId, position: Position3D): void {
    const key = positionToKey(position);
    const ids = this.spatialIndex.get(key);

    if (ids) {
      ids.delete(id);

      // Clean up empty sets
      if (ids.size === 0) {
        this.spatialIndex.delete(key);
      }
    }
  }

  /** Check if two positions are equal */
  private positionsEqual(a: Position3D, b: Position3D): boolean {
    return a.x === b.x && a.y === b.y && a.z === b.z;
  }

  /** Deep merge character changes */
  private mergeCharacter(
    base: Character,
    changes: Partial<Character>,
  ): Character {
    return {
      ...base,
      ...changes,
      // Deep merge nested objects
      movement: changes.movement
        ? { ...base.movement, ...changes.movement }
        : base.movement,
      control: changes.control
        ? { ...base.control, ...changes.control }
        : base.control,
      needs: changes.needs ? { ...base.needs, ...changes.needs } : base.needs,
      // Ensure position and visualOffset are fully replaced if provided
      position: changes.position ?? base.position,
      visualOffset: changes.visualOffset ?? base.visualOffset,
    };
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/** Global entity store instance */
export const entityStore = new EntityStore();
