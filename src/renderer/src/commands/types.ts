import type React from "react";
import type { ColonyContextData } from "../context/types";
import type { IconComponent } from "../menu/types";
import type { ObjectSchema } from "../schemas";

// =============================================================================
// UI ACTION TYPES (for buttons, menus, etc.)
// =============================================================================

/**
 * Base action interface with common properties shared by all action types.
 * These are for UI elements (buttons, menu items) and their click behavior.
 */
export interface BaseAction {
  id: string;
  label?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  disabled?: boolean;
  variant?: "default" | "destructive";
}

/**
 * Handler-based action that executes a function directly.
 * Best for simple actions and Storybook examples.
 */
export interface HandlerAction extends BaseAction {
  type: "handler";
  onExecute: () => void | Promise<void>;
}

/**
 * Command-based UI action that dispatches through the command registry.
 * Best for application-wide commands that need to be consistent and type-safe.
 */
export interface DispatchAction extends BaseAction {
  type: "command";
  commandId: string;
  payload?: Record<string, unknown>;
}

/**
 * Union type for all supported UI action types.
 */
export type Action = HandlerAction | DispatchAction;

// =============================================================================
// COMMAND SYSTEM TYPES (unified command/event system)
// =============================================================================

export type { ColonyContextData };

/**
 * Type-safe command definition for Colony.
 *
 * Commands unify the concepts of "executable commands" (user actions) and
 * "notifications" (events about state changes) into a single system.
 *
 * - Commands with `execute` are "executable" - they can be triggered by keybindings,
 *   the command palette, or programmatically.
 * - Commands without `execute` are "notifications" - they're dispatched by the
 *   system to notify subscribers about state changes.
 * - All commands can have subscribers via `commandRegistry.on()`.
 */
export interface CommandDefinition<TPayload = void> {
  /** Unique identifier, e.g., "world.setZoom" or "selection.changed" */
  id: string;

  /** Human-readable name for display in command palette, etc. */
  name: string;

  /** Optional description for tooltips and documentation */
  description?: string;

  /**
   * Icon component (not instantiated) for this command.
   * Used in command palettes, menus, and anywhere the command is displayed.
   */
  icon?: IconComponent;

  /**
   * Schema for command payload.
   * If provided and command is dispatched without payload, a form modal will be shown.
   * Also used for validation when payload is provided.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payloadSchema?: ObjectSchema<any>;

  /**
   * Optional execution function. If provided, this command is "executable" and
   * can be invoked via keybindings, command palette, etc.
   *
   * If not provided, this command is a pure notification - it can only be
   * dispatched to notify subscribers.
   *
   * @param context - The colony context data
   * @param payload - Optional payload passed to the command
   */
  execute?: (
    context: ColonyContextData,
    payload?: TPayload,
  ) => void | Promise<void>;

  /**
   * If true, this command won't appear in the command palette.
   * Use for commands that require parameters and can't be user-invoked directly.
   */
  hidden?: boolean;
}

/**
 * Handler function for command subscriptions.
 */
export type CommandHandler<TPayload = unknown> = (payload: TPayload) => void;

/**
 * Generic handler that can receive any command payload.
 */
export type AnyCommandHandler = (commandId: string, payload: unknown) => void;

/**
 * Command ID type for clarity.
 */
export type CommandId = string;

/**
 * Keybinding interface for command-based keybindings.
 */
export interface Keybinding {
  key: string | string[];
  command: string;
  payload?: Record<string, unknown>;
}

/**
 * Command registry interface.
 */
export interface CommandRegistry {
  /**
   * Register a command definition.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: (command: CommandDefinition<any>) => void;

  /**
   * Set the context for command execution.
   */
  setContext: (context: ColonyContextData) => void;

  /**
   * Dispatch a command by ID.
   * - If the command has an `execute` function, it will be called first.
   * - All subscribers will be notified after execution (or immediately for notifications).
   *
   * @param commandId - The command ID to dispatch
   * @param payload - Optional payload for the command
   */
  dispatch: (commandId: string, payload?: unknown) => Promise<void>;

  /**
   * Subscribe to a command.
   * Handler will be called whenever the command is dispatched.
   *
   * @returns Unsubscribe function
   */
  on: <TPayload = unknown>(
    commandId: string,
    handler: CommandHandler<TPayload>,
  ) => () => void;

  /**
   * Subscribe to all commands.
   * Handler will be called for every command dispatch.
   *
   * @returns Unsubscribe function
   */
  onAny: (handler: AnyCommandHandler) => () => void;

  /**
   * Get a command definition by ID.
   */
  getCommand: (commandId: string) => CommandDefinition | undefined;

  /**
   * Get all registered commands.
   */
  getAllCommands: () => CommandDefinition[];

  /**
   * Get only executable commands (those with an `execute` function).
   * Useful for command palette.
   */
  getExecutableCommands: () => CommandDefinition[];

  /**
   * Clear all registered commands.
   */
  clear: () => void;
}
