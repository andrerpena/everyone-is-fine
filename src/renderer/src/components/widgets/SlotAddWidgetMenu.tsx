import { Plus, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../dropdown-menu";
import { SLOT_LABELS } from "./slot-labels";
import type { WidgetSlotId } from "./types";
import {
  canAddWidgetToSlot,
  useWidgetLayoutStore,
} from "./widget-layout-store";
import { widgetRegistry } from "./widget-registry";

interface SlotAddWidgetMenuProps {
  slotId: WidgetSlotId;
}

export function SlotAddWidgetMenu({ slotId }: SlotAddWidgetMenuProps) {
  const addWidgetToSlot = useWidgetLayoutStore((s) => s.addWidgetToSlot);
  const layout = useWidgetLayoutStore((s) => s.layout);

  const widgetsInSlot = new Set(layout.slots[slotId] ?? []);
  const allWidgets = widgetRegistry.getAll();

  const addableWidgets = allWidgets.filter((w) => {
    if (widgetsInSlot.has(w.id)) return false;
    if (!canAddWidgetToSlot(w.id, slotId)) return false;
    if (w.placement?.pinned) return false;
    return true;
  });

  if (addableWidgets.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
          aria-label={`Add widget to ${SLOT_LABELS[slotId]}`}
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Plus className="h-4 w-4" />
            Add Widget
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {addableWidgets.map((widget) => {
              const Icon = widget.icon;
              return (
                <DropdownMenuItem
                  key={widget.id}
                  onClick={() => addWidgetToSlot(widget.id, slotId)}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {widget.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
