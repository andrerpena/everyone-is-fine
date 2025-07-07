import type { CommandDefinition } from "./types";

/**
 * Factory function for creating type-safe command definitions.
 *
 * Use this to define commands that can be:
 * - Dispatched by name (for keybindings, command palette)
 * - Subscribed to (for reactive updates)
 *
 * @example
 * // Executable command
 * const setZoom = defineCommand<{ scale: number }>({
 *   id: "world.setZoom",
 *   name: "Set Zoom Level",
 *   icon: ZoomIn,
 *   payloadSchema: nu.object({ scale: nu.number() }),
 *   execute: (context, payload) => {
 *     context.game.setZoom(payload?.scale ?? 1);
 *   },
 * });
 *
 * @example
 * // Notification-only command (like an event)
 * const zLevelChanged = defineCommand<{ previousZ: number; currentZ: number }>({
 *   id: "world.zLevelChanged",
 *   name: "Z-Level Changed",
 *   // No execute - this is purely a notification
 * });
 *
 * @param definition - The command definition
 * @returns A typed command definition
 */
export function defineCommand<TPayload = void>(
  definition: CommandDefinition<TPayload>,
): CommandDefinition<TPayload> {
  return definition;
}
