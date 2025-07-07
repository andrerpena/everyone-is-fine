// =============================================================================
// COMMANDS MODULE - Unified command/event system
// =============================================================================

// Core registry
export { CommandRegistryImpl, commandRegistry } from "./CommandRegistry";

// Factory function
export { defineCommand } from "./defineCommand";

// Command executor
export { executeAction } from "./executeAction";

// Types
export type {
  // UI action types (for buttons, menus)
  Action,
  AnyCommandHandler,
  BaseAction,
  ColonyContextData,
  // Command system types
  CommandDefinition,
  CommandHandler,
  CommandId,
  CommandRegistry,
  DispatchAction,
  HandlerAction,
  Keybinding,
} from "./types";

// React hooks
export {
  useCommand,
  useCommandAny,
  useCommandOnce,
  useDispatch,
  useDispatchCommand,
} from "./useCommand";
