import type { SetActiveTabPayload } from "@renderer/commands/definitions/widget.setActiveTab";
import { useCommand } from "@renderer/commands/useCommand";
import { useMemo, useState } from "react";
import type { TabItem } from "../tabs";
import { Tabs } from "../tabs";
import { SlotAddWidgetMenu } from "./SlotAddWidgetMenu";
import type { WidgetId, WidgetSlotId } from "./types";
import { WidgetTabContextMenu } from "./WidgetTabContextMenu";
import { useWidgetLayoutStore, useWidgetsForSlot } from "./widget-layout-store";
import { widgetRegistry } from "./widget-registry";

interface WidgetSlotProps {
  /** The slot identifier */
  slotId: WidgetSlotId;
  /** Optional class name for styling */
  className?: string;
  /** Tab variant - defaults to "secondary" */
  variant?: "primary" | "secondary";
  /** Keep all tab panels mounted when switching tabs */
  keepMounted?: boolean;
}

/**
 * WidgetSlot renders all widgets assigned to a specific slot as tabs.
 *
 * - Uses secondary variant tabs by default (transparent background, bottom border indicators)
 * - Always shows tabs even when there's only 1 widget
 * - Returns null when slot has zero widgets (Dock will hide the slot)
 * - Respects widget placement constraints (pinned widgets cannot be closed)
 * - Listens for widget.setActiveTab commands to bring widgets to front
 */
export function WidgetSlot({
  slotId,
  className,
  variant = "secondary",
  keepMounted = false,
}: WidgetSlotProps) {
  const widgetIds = useWidgetsForSlot(slotId);
  const removeWidgetFromSlot = useWidgetLayoutStore(
    (s) => s.removeWidgetFromSlot,
  );
  const [activeTabId, setActiveTabId] = useState<string | undefined>(undefined);

  // Subscribe to widget.setActiveTab command
  useCommand<SetActiveTabPayload>("widget.setActiveTab", (payload) => {
    // Check if this slot contains the requested widget
    // Cast needed because payload comes from external source as string
    if ((widgetIds as string[]).includes(payload.widgetId)) {
      setActiveTabId(payload.widgetId);
    }
  });

  // Convert widget IDs to TabItems
  const tabs = useMemo(() => {
    const result: TabItem[] = [];

    for (const widgetId of widgetIds) {
      const definition = widgetRegistry.get(widgetId);
      if (!definition) {
        console.warn(`Widget "${widgetId}" not found in registry`);
        continue;
      }

      const Component = definition.component;

      const isPinned = definition.placement?.pinned ?? false;

      result.push({
        id: widgetId,
        label: definition.label,
        icon: definition.icon,
        closable: !isPinned,
        content: <Component widgetId={widgetId} slotId={slotId} />,
        contextMenu: (
          <WidgetTabContextMenu widgetId={widgetId} currentSlotId={slotId} />
        ),
      });
    }

    return result;
  }, [widgetIds, slotId]);

  // Return null for empty slots - Dock will hide the slot
  if (tabs.length === 0) {
    return null;
  }

  return (
    <Tabs
      tabs={tabs}
      activeTabId={activeTabId}
      onTabChange={setActiveTabId}
      onTabClose={(tabId) => removeWidgetFromSlot(tabId as WidgetId)}
      variant={variant}
      className={className}
      keepMounted={keepMounted}
      trailingAction={<SlotAddWidgetMenu slotId={slotId} />}
    />
  );
}
