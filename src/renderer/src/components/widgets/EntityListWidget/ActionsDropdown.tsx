// =============================================================================
// ACTIONS DROPDOWN COMPONENT
// =============================================================================

import { MoreHorizontal } from "lucide-react";
import type { SchemaAction } from "../../../schemas/core/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../dropdown-menu";

interface ActionsDropdownProps {
  actions: SchemaAction[];
  onActionExecute: (action: SchemaAction) => void;
}

export function ActionsDropdown({
  actions,
  onActionExecute,
}: ActionsDropdownProps) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal size={14} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem
              key={action.id}
              onClick={(e) => {
                e.stopPropagation();
                onActionExecute(action);
              }}
            >
              {Icon && <Icon size={12} />}
              {action.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
