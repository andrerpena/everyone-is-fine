import { PanelTop } from "lucide-react";
import { SearchableTreeNavigator } from "../../components/command-palette";
import { ModalFrame } from "../../components/floating/modal";
import { useWidgetLayoutStore } from "../../components/widgets/widget-layout-store";
import { widgetRegistry } from "../../components/widgets/widget-registry";
import type { MenuItem } from "../../menu/types";
import { type Infer, nu } from "../../schemas";
import { commandRegistry } from "../CommandRegistry";
import { defineCommand } from "../defineCommand";

const bringToFrontSchema = nu.object({
  widgetId: nu.string().optional().withMetadata({
    label: "Widget",
    description: "The widget to bring to front (optional)",
  }),
});

export type BringToFrontPayload = Infer<typeof bringToFrontSchema>;

/**
 * Command that brings a widget to front (selects its tab) across all slots where it exists.
 *
 * Behavior:
 * - If widgetId is provided: Find widget in layout and bring to front in ALL slots that contain it
 * - If widgetId not provided: Show a picker modal with all widgets currently in the layout
 * - If widget not found in any slot: Silently ignore
 */
export const widgetBringToFront = defineCommand<BringToFrontPayload>({
  id: "widget.bringToFront",
  name: "Bring Widget to Front",
  icon: PanelTop,
  payloadSchema: bringToFrontSchema,
  execute: (context, payload) => {
    // If widgetId is provided, bring that widget to front directly
    if (payload?.widgetId) {
      commandRegistry.dispatch("widget.setActiveTab", {
        widgetId: payload.widgetId,
      });
      return;
    }

    // Otherwise, show widget picker
    const allWidgets = widgetRegistry.getAll();
    const layout = useWidgetLayoutStore.getState().layout;

    // Get widgets currently in any slot
    const widgetsInLayout = new Set(Object.values(layout.slots).flat());

    const widgetItems: MenuItem[] = allWidgets
      .filter((w) => widgetsInLayout.has(w.id))
      .map((widget) => ({
        id: widget.id,
        icon: widget.icon,
        label: widget.label,
        subtitle: `Bring ${widget.label} to front`,
        onExecute: () => {
          context.modal.closeAllModals();
          commandRegistry.dispatch("widget.setActiveTab", {
            widgetId: widget.id,
          });
        },
      }));

    context.modal.openModal({
      content: (
        <ModalFrame>
          <SearchableTreeNavigator
            items={widgetItems}
            placeHolder="Search widgets..."
          />
        </ModalFrame>
      ),
      alignment: "top",
      size: "lg",
      showBackdrop: true,
    });
  },
});
