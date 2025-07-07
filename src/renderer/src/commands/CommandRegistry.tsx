// =============================================================================
// COMMAND REGISTRY IMPLEMENTATION
// =============================================================================

import { SchemaFormModal } from "../components/form";
import { logger } from "../lib/logger";
import type {
  AnyCommandHandler,
  ColonyContextData,
  CommandDefinition,
  CommandHandler,
  CommandRegistry,
} from "./types";

/**
 * Unified command registry that combines command execution and event subscription.
 *
 * This provides a single system where:
 * - Commands can be dispatched by string ID (for keybindings)
 * - Commands can have subscribers (for reactive updates)
 * - Commands can optionally have an executor (makes them executable)
 */
class CommandRegistryImpl implements CommandRegistry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private commands = new Map<string, CommandDefinition<any>>();
  private handlers = new Map<string, Set<CommandHandler>>();
  private anyHandlers = new Set<AnyCommandHandler>();
  private context: ColonyContextData | null = null;
  private debugMode = false;

  /**
   * Set the context for command execution.
   */
  setContext(context: ColonyContextData) {
    this.context = context;
  }

  /**
   * Register a command definition.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register(command: CommandDefinition<any>) {
    this.commands.set(command.id, command);
  }

  /**
   * Dispatch a command by ID.
   *
   * Flow:
   * 1. If command has payloadSchema and no payload provided, show form modal
   * 2. If command has payloadSchema and payload provided, validate it
   * 3. If command has execute function, call it
   * 4. Notify all subscribers
   */
  async dispatch(commandId: string, payload?: unknown): Promise<void> {
    const command = this.commands.get(commandId);

    // For notification-only dispatches (no registered command), just notify subscribers
    if (!command) {
      if (this.debugMode) {
        console.log(
          `[CommandRegistry] Dispatching unregistered command: ${commandId}`,
          payload,
        );
      }
      this.notifySubscribers(commandId, payload);
      return;
    }

    // If command has payloadSchema and no payload provided, show form modal
    if (command.payloadSchema && payload === undefined && command.execute) {
      if (!this.context) {
        throw new Error(
          "Command context not set. Make sure to initialize the command system.",
        );
      }

      const context = this.context;
      context.modal.closeAllModals();
      context.modal.openModal({
        content: (
          <SchemaFormModal
            schema={command.payloadSchema}
            title={command.name}
            onSubmit={(data) => {
              context.modal.closeModal();
              this.dispatch(commandId, data);
            }}
            onCancel={() => context.modal.closeModal()}
          />
        ),
        alignment: "top",
        size: "lg",
        showBackdrop: true,
      });
      return;
    }

    // Validate payload if schema exists
    if (command.payloadSchema && payload !== undefined) {
      const result = command.payloadSchema.toZod().safeParse(payload);
      if (!result.success) {
        logger.error(`Invalid payload for command "${commandId}"`, [
          "commands",
        ]);
        return;
      }
      payload = result.data;
    }

    // Execute if command has an executor
    if (command.execute) {
      if (!this.context) {
        throw new Error(
          "Command context not set. Make sure to initialize the command system.",
        );
      }

      try {
        await command.execute(this.context, payload);
      } catch (error) {
        logger.error(
          `Error executing command "${commandId}": ${String(error)}`,
          ["commands"],
        );
        return; // Don't notify subscribers if execution failed
      }
    }

    // Debug logging
    if (this.debugMode) {
      console.log(`[CommandRegistry] ${commandId}`, payload);
    }

    // Notify subscribers
    this.notifySubscribers(commandId, payload);
  }

  /**
   * Notify all subscribers of a command dispatch.
   */
  private notifySubscribers(commandId: string, payload: unknown): void {
    // Notify specific handlers
    const specificHandlers = this.handlers.get(commandId);
    if (specificHandlers) {
      for (const handler of specificHandlers) {
        try {
          handler(payload);
        } catch (error) {
          logger.error(`Error in handler for ${commandId}: ${String(error)}`, [
            "commands",
          ]);
        }
      }
    }

    // Notify wildcard handlers
    for (const handler of this.anyHandlers) {
      try {
        handler(commandId, payload);
      } catch (error) {
        logger.error(`Error in wildcard handler: ${String(error)}`, [
          "commands",
        ]);
      }
    }
  }

  /**
   * Subscribe to a command.
   */
  on<TPayload = unknown>(
    commandId: string,
    handler: CommandHandler<TPayload>,
  ): () => void {
    let handlers = this.handlers.get(commandId);
    if (!handlers) {
      handlers = new Set();
      this.handlers.set(commandId, handlers);
    }

    handlers.add(handler as CommandHandler);

    // Return unsubscribe function
    return () => {
      handlers.delete(handler as CommandHandler);
      if (handlers.size === 0) {
        this.handlers.delete(commandId);
      }
    };
  }

  /**
   * Subscribe to all commands.
   */
  onAny(handler: AnyCommandHandler): () => void {
    this.anyHandlers.add(handler);

    return () => {
      this.anyHandlers.delete(handler);
    };
  }

  /**
   * Get a command definition by ID.
   */
  getCommand(commandId: string): CommandDefinition | undefined {
    return this.commands.get(commandId);
  }

  /**
   * Get all registered commands.
   */
  getAllCommands(): CommandDefinition[] {
    return Array.from(this.commands.values());
  }

  /**
   * Get only executable commands (those with an `execute` function).
   * Excludes hidden commands (those not meant for user invocation).
   */
  getExecutableCommands(): CommandDefinition[] {
    return Array.from(this.commands.values()).filter(
      (command) => command.execute !== undefined && !command.hidden,
    );
  }

  /**
   * Clear all registered commands and handlers.
   */
  clear() {
    this.commands.clear();
    this.handlers.clear();
    this.anyHandlers.clear();
  }

  /**
   * Enable/disable debug logging.
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  /**
   * Get current handler count (for debugging).
   */
  getHandlerCount(commandId?: string): number {
    if (commandId) {
      return this.handlers.get(commandId)?.size ?? 0;
    }
    let total = this.anyHandlers.size;
    for (const handlers of this.handlers.values()) {
      total += handlers.size;
    }
    return total;
  }
}

// Singleton instance
export const commandRegistry = new CommandRegistryImpl();

// Also export the class for testing
export { CommandRegistryImpl };
