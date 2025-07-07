// =============================================================================
// COMMAND REACT HOOKS
// =============================================================================

import { useCallback, useEffect, useRef } from "react";
import { commandRegistry } from "./CommandRegistry";
import type { AnyCommandHandler, CommandHandler } from "./types";

/**
 * Subscribe to a specific command.
 * Handler will be called whenever the command is dispatched.
 *
 * @example
 * useCommand("world.zLevelChanged", ({ previousZ, currentZ }) => {
 *   console.log(`Z-level changed from ${previousZ} to ${currentZ}`);
 * });
 *
 * @param commandId - The command ID to subscribe to
 * @param handler - Callback function called when command is dispatched
 */
export function useCommand<TPayload = unknown>(
  commandId: string,
  handler: CommandHandler<TPayload>,
): void {
  // Use ref to avoid re-subscribing when handler changes
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const unsubscribe = commandRegistry.on<TPayload>(commandId, (payload) => {
      handlerRef.current(payload);
    });

    return unsubscribe;
  }, [commandId]);
}

/**
 * Subscribe to all commands.
 * Handler will be called for every command dispatch.
 *
 * Useful for debugging, logging, or implementing command history.
 *
 * @example
 * useCommandAny((commandId, payload) => {
 *   console.log(`Command dispatched: ${commandId}`, payload);
 * });
 *
 * @param handler - Callback function called for every command
 */
export function useCommandAny(handler: AnyCommandHandler): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const unsubscribe = commandRegistry.onAny((commandId, payload) => {
      handlerRef.current(commandId, payload);
    });

    return unsubscribe;
  }, []);
}

/**
 * Subscribe to a command only once.
 * Handler will be called on the first dispatch, then automatically unsubscribed.
 *
 * @param commandId - The command ID to subscribe to
 * @param handler - Callback function called once when command is dispatched
 */
export function useCommandOnce<TPayload = unknown>(
  commandId: string,
  handler: CommandHandler<TPayload>,
): void {
  const handlerRef = useRef(handler);
  const calledRef = useRef(false);
  handlerRef.current = handler;

  useEffect(() => {
    if (calledRef.current) return;

    const unsubscribe = commandRegistry.on<TPayload>(commandId, (payload) => {
      if (!calledRef.current) {
        calledRef.current = true;
        handlerRef.current(payload);
        unsubscribe();
      }
    });

    return unsubscribe;
  }, [commandId]);
}

/**
 * Get a stable dispatch function for dispatching commands.
 *
 * @example
 * const dispatch = useDispatch();
 *
 * const handleClick = () => {
 *   dispatch("world.setZoom", { scale: 2 });
 * };
 *
 * @returns A stable dispatch function
 */
export function useDispatch(): (
  commandId: string,
  payload?: unknown,
) => Promise<void> {
  return useCallback((commandId: string, payload?: unknown) => {
    return commandRegistry.dispatch(commandId, payload);
  }, []);
}

/**
 * Get a stable dispatch function bound to a specific command ID.
 *
 * @example
 * const setZoom = useDispatchCommand<{ scale: number }>("world.setZoom");
 *
 * const handleClick = () => {
 *   setZoom({ scale: 2 });
 * };
 *
 * @param commandId - The command ID to bind
 * @returns A stable dispatch function for that specific command
 */
export function useDispatchCommand<TPayload = void>(
  commandId: string,
): (payload?: TPayload) => Promise<void> {
  return useCallback(
    (payload?: TPayload) => {
      return commandRegistry.dispatch(commandId, payload);
    },
    [commandId],
  );
}
