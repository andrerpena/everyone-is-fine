import { commandRegistry } from "@renderer/commands";
import { ArrowRightFromLine, Maximize2, X } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "../dropdown-menu";
import { SLOT_LABELS } from "./slot-labels";
import type { WidgetId, WidgetSlotId } from "./types";
import { MAIN_SLOTS, SIDEBAR_SLOTS } from "./types";
import {
  canAddWidgetToSlot,
  canRemoveWidget,
  useWidgetLayoutStore,
} from "./widget-layout-store";
import { widgetRegistry } from "./widget-registry";

interface WidgetTabContextMenuProps {
  widgetId: WidgetId;
  currentSlotId: WidgetSlotId;
}

export function WidgetTabContextMenu({
  widgetId,
  currentSlotId,
}: WidgetTabContextMenuProps) {
  const addWidgetToSlot = useWidgetLayoutStore((s) => s.addWidgetToSlot);
  const removeWidgetFromSlot = useWidgetLayoutStore(
    (s) => s.removeWidgetFromSlot,
  );
  const definition = widgetRegistry.get(widgetId);

  if (!definition) return null;

  const isWide = definition.size === "wide";
  const canRemove = canRemoveWidget(widgetId);

  const allSlots: WidgetSlotId[] = [...SIDEBAR_SLOTS, ...MAIN_SLOTS];
  const addTargets = allSlots
    .filter((s) => s !== currentSlotId)
    .map((slotId) => ({
      slotId,
      label: SLOT_LABELS[slotId],
      enabled: canAddWidgetToSlot(widgetId, slotId),
    }));

  const hasAnyAddTarget = addTargets.some((t) => t.enabled);

  return (
    <>
      {hasAnyAddTarget && (
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <ArrowRightFromLine className="h-4 w-4" />
            Add to Panel
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {addTargets.map(({ slotId, label, enabled }) => (
              <DropdownMenuItem
                key={slotId}
                disabled={!enabled}
                onClick={() => addWidgetToSlot(widgetId, slotId)}
              >
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      )}

      {!isWide && (
        <DropdownMenuItem
          onClick={() =>
            commandRegistry.dispatch("widget.openInModal", { widgetId })
          }
        >
          <Maximize2 className="h-4 w-4" />
          Open in Modal
        </DropdownMenuItem>
      )}

      {canRemove && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => removeWidgetFromSlot(widgetId)}
          >
            <X className="h-4 w-4" />
            Remove from Panel
          </DropdownMenuItem>
        </>
      )}
    </>
  );
}
