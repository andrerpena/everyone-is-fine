import type { ColonyContextData } from "../context/types";
import { commandRegistry } from "./CommandRegistry";
import type { Action, DispatchAction, HandlerAction } from "./types";

/**
 * Standalone action executor that can be used outside of React components.
 * This is the core logic extracted for use in KeybindingManager.
 *
 * @param action - The action to execute
 * @param context - The Colony context (optional, required for dispatch actions)
 * @returns Promise that resolves when action completes
 */
export async function executeAction(
  action: Action,
  context?: ColonyContextData | null,
): Promise<void> {
  if (action.disabled) {
    return;
  }

  switch (action.type) {
    case "handler": {
      const handlerAction = action as HandlerAction;
      try {
        await handlerAction.onExecute();
      } catch (error) {
        console.error(`Error executing handler action "${action.id}":`, error);
      }
      break;
    }
    case "command": {
      const dispatchAction = action as DispatchAction;

      // Check if context is available for command execution
      if (!context) {
        throw new Error(
          `Cannot dispatch command "${dispatchAction.commandId}" - ColonyContext not available.`,
        );
      }

      try {
        await commandRegistry.dispatch(
          dispatchAction.commandId,
          dispatchAction.payload,
        );
      } catch (error) {
        console.error(`Error dispatching command "${action.id}":`, error);
      }
      break;
    }
    default: {
      // TypeScript exhaustiveness check
      const _exhaustiveCheck: never = action;
      console.error(`Unknown action type:`, _exhaustiveCheck);
      break;
    }
  }
}
