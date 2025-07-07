// =============================================================================
// STATUS BAR BUTTON COMPONENT
// =============================================================================

import { useDispatch } from "@renderer/commands";
import type { LucideIcon } from "lucide-react";

export interface StatusBarButtonProps {
  /** Text to display */
  text: string;
  /** Optional Lucide icon */
  icon?: LucideIcon;
  /** Optional command ID to dispatch on click */
  commandId?: string;
  /** Optional command payload */
  commandArgs?: Record<string, unknown>;
}

/**
 * Reusable button component for status bar items.
 * If commandId is provided, the button is clickable and dispatches the command.
 * If no commandId, it renders as static text.
 */
export function StatusBarButton({
  text,
  icon: Icon,
  commandId,
  commandArgs,
}: StatusBarButtonProps) {
  const dispatch = useDispatch();

  const isClickable = !!commandId;

  const handleClick = () => {
    if (commandId) {
      dispatch(commandId, commandArgs);
    }
  };

  const baseClasses = "flex items-center gap-1";
  const clickableClasses = isClickable
    ? "cursor-pointer hover:bg-accent hover:text-accent-foreground rounded px-1 -mx-1 transition-colors"
    : "";

  return (
    <span
      className={`${baseClasses} ${clickableClasses}`}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleClick();
              }
            }
          : undefined
      }
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {Icon && <Icon size={12} />}
      <span>{text}</span>
    </span>
  );
}
