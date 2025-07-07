// =============================================================================
// MOVEMENT SYSTEM
// =============================================================================
// Processes character movement along paths each tick

import type { Position3D } from "../../world/types";
import type { EntityStore } from "../entity-store";
import type { Character, EntityId, MoveCommand } from "../types";

// =============================================================================
// MOVEMENT SYSTEM CLASS
// =============================================================================

/**
 * Processes character movement along paths.
 *
 * Each tick:
 * 1. Advances characters along their paths based on speed and delta time
 * 2. Updates visual offsets for smooth interpolation
 * 3. Completes move commands when destination is reached
 */
export class MovementSystem {
  private entityStore: EntityStore;

  /** Callback when a character's position changes */
  onPositionChange: ((id: EntityId, character: Character) => void) | null =
    null;

  /** Callback when a character completes movement */
  onMovementComplete: ((id: EntityId, character: Character) => void) | null =
    null;

  constructor(entityStore: EntityStore) {
    this.entityStore = entityStore;
  }

  /**
   * Update all character movements for one tick.
   *
   * @param deltaTime - Time since last tick in seconds
   */
  update(deltaTime: number): void {
    for (const character of this.entityStore.values()) {
      if (character.movement.isMoving && character.movement.path) {
        this.updateCharacterMovement(character, deltaTime);
      }
    }
  }

  /**
   * Update a single character's movement.
   */
  private updateCharacterMovement(
    character: Character,
    deltaTime: number,
  ): void {
    const { movement } = character;
    const { path, pathIndex, speed } = movement;

    if (!path || pathIndex >= path.length - 1) {
      // At destination or no path
      this.completeMovement(character);
      return;
    }

    // Current and next waypoint
    const currentWaypoint = path[pathIndex];
    const nextWaypoint = path[pathIndex + 1];

    // Calculate distance between waypoints
    const dx = nextWaypoint.x - currentWaypoint.x;
    const dy = nextWaypoint.y - currentWaypoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Progress per tick based on speed
    const progressIncrement = (speed * deltaTime) / distance;

    // Update progress
    const newProgress = movement.progress + progressIncrement;

    if (newProgress >= 1) {
      // Reached next waypoint
      const newPathIndex = pathIndex + 1;

      // Update character position to next waypoint
      this.entityStore.update(character.id, {
        position: { ...nextWaypoint },
        visualOffset: { x: 0, y: 0 },
        movement: {
          ...movement,
          pathIndex: newPathIndex,
          progress: 0,
          isMoving: newPathIndex < path.length - 1,
        },
      });

      // Notify position change
      const updated = this.entityStore.get(character.id);
      if (updated) {
        this.onPositionChange?.(character.id, updated);

        // Check if at final destination
        if (newPathIndex >= path.length - 1) {
          this.completeMovement(updated);
        }
      }
    } else {
      // Still moving between waypoints
      // Calculate visual offset for smooth rendering
      const visualOffset = {
        x: dx * newProgress,
        y: dy * newProgress,
      };

      this.entityStore.update(character.id, {
        visualOffset,
        movement: {
          ...movement,
          progress: newProgress,
        },
      });
    }
  }

  /**
   * Complete a character's movement.
   */
  private completeMovement(character: Character): void {
    // Clear movement state
    this.entityStore.update(character.id, {
      visualOffset: { x: 0, y: 0 },
      movement: {
        ...character.movement,
        path: null,
        pathIndex: 0,
        progress: 0,
        isMoving: false,
      },
      control: {
        ...character.control,
        mode: "idle",
        currentCommand:
          character.control.currentCommand?.type === "move"
            ? { ...character.control.currentCommand, status: "completed" }
            : character.control.currentCommand,
      },
    });

    const updated = this.entityStore.get(character.id);
    if (updated) {
      this.onMovementComplete?.(character.id, updated);
    }
  }

  /**
   * Start a character moving along a path.
   */
  startMovement(characterId: EntityId, path: Position3D[]): boolean {
    const character = this.entityStore.get(characterId);
    if (!character) return false;

    if (path.length < 2) {
      // Path too short, already at destination
      return false;
    }

    this.entityStore.update(characterId, {
      movement: {
        ...character.movement,
        path,
        pathIndex: 0,
        progress: 0,
        isMoving: true,
      },
    });

    return true;
  }

  /**
   * Stop a character's movement immediately.
   */
  stopMovement(characterId: EntityId): boolean {
    const character = this.entityStore.get(characterId);
    if (!character) return false;

    this.entityStore.update(characterId, {
      visualOffset: { x: 0, y: 0 },
      movement: {
        ...character.movement,
        path: null,
        pathIndex: 0,
        progress: 0,
        isMoving: false,
      },
    });

    return true;
  }

  /**
   * Issue a move command to a character.
   */
  issueMove(characterId: EntityId, command: MoveCommand): boolean {
    const character = this.entityStore.get(characterId);
    if (!character) return false;

    // Path should already be computed in the command
    if (!command.path || command.path.length < 2) {
      return false;
    }

    this.entityStore.update(characterId, {
      control: {
        ...character.control,
        mode: "imperative",
        currentCommand: {
          ...command,
          status: "active",
          assignedTo: characterId,
        },
      },
      movement: {
        ...character.movement,
        path: command.path,
        pathIndex: 0,
        progress: 0,
        isMoving: true,
      },
    });

    return true;
  }

  /**
   * Cancel current movement command.
   */
  cancelMove(characterId: EntityId): boolean {
    const character = this.entityStore.get(characterId);
    if (!character) return false;

    const currentCommand = character.control.currentCommand;

    this.entityStore.update(characterId, {
      visualOffset: { x: 0, y: 0 },
      movement: {
        ...character.movement,
        path: null,
        pathIndex: 0,
        progress: 0,
        isMoving: false,
      },
      control: {
        ...character.control,
        mode: "idle",
        currentCommand: currentCommand
          ? { ...currentCommand, status: "cancelled" }
          : null,
      },
    });

    return true;
  }
}
