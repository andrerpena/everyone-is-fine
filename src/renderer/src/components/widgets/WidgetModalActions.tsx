import { PanelLeft } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../dropdown-menu";
import { SLOT_LABELS } from "./slot-labels";
import type { WidgetId, WidgetSlotId } from "./types";
import { MAIN_SLOTS, SIDEBAR_SLOTS } from "./types";
import {
  canAddWidgetToSlot,
  useWidgetLayoutStore,
} from "./widget-layout-store";
import { widgetRegistry } from "./widget-registry";

interface WidgetModalActionsProps {
  widgetId: WidgetId;
}

export function WidgetModalActions({ widgetId }: WidgetModalActionsProps) {
  const addWidgetToSlot = useWidgetLayoutStore((s) => s.addWidgetToSlot);
  const layout = useWidgetLayoutStore((s) => s.layout);
  const definition = widgetRegistry.get(widgetId);

  if (!definition) return null;

  const currentSlot = (
    Object.entries(layout.slots) as [WidgetSlotId, WidgetId[]][]
  ).find(([, ids]) => ids.includes(widgetId))?.[0];

  const allSlots: WidgetSlotId[] = [...SIDEBAR_SLOTS, ...MAIN_SLOTS];
  const targets = allSlots
    .map((slotId) => ({
      slotId,
      label: SLOT_LABELS[slotId],
      enabled: canAddWidgetToSlot(widgetId, slotId),
      isCurrent: slotId === currentSlot,
    }))
    .filter((t) => t.enabled);

  if (targets.length === 0) return null;

  const actionLabel = currentSlot ? "Move to Panel" : "Add to Panel";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
          aria-label={actionLabel}
          title={actionLabel}
        >
          <PanelLeft className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom">
        {targets.map(({ slotId, label, isCurrent }) => (
          <DropdownMenuItem
            key={slotId}
            disabled={isCurrent}
            onClick={() => addWidgetToSlot(widgetId, slotId)}
          >
            {label}
            {isCurrent && " (current)"}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
