import { Maximize2 } from "lucide-react";
import { SearchableTreeNavigator } from "../../components/command-palette";
import {
  ModalFrame,
  ModalFrameStructured,
} from "../../components/floating/modal";
import { WidgetModalActions } from "../../components/widgets/WidgetModalActions";
import { widgetRegistry } from "../../components/widgets/widget-registry";
import type { MenuItem } from "../../menu/types";
import { type Infer, nu } from "../../schemas";
import { defineCommand } from "../defineCommand";

const openInModalSchema = nu.object({
  widgetId: nu.string().optional().withMetadata({
    label: "Widget",
    description: "The widget to open in a modal",
  }),
});

export type OpenInModalPayload = Infer<typeof openInModalSchema>;

/**
 * Command that opens a widget in a modal dialog.
 *
 * Behavior:
 * - If widgetId is provided: Open that widget in a large modal
 * - If widgetId not provided: Show a picker modal with eligible widgets
 * - Wide widgets (size: "wide") are excluded
 */
export const widgetOpenInModal = defineCommand<OpenInModalPayload>({
  id: "widget.openInModal",
  name: "Open Widget in Modal",
  icon: Maximize2,
  execute: (context, payload) => {
    const getEligibleWidgets = () =>
      widgetRegistry.getAll().filter((w) => w.size !== "wide");

    if (payload?.widgetId) {
      const widget = widgetRegistry.get(payload.widgetId);

      if (!widget) {
        console.warn(`Widget "${payload.widgetId}" not found`);
        return;
      }

      if (widget.size === "wide") {
        console.warn(`Widget "${payload.widgetId}" cannot be opened in modal`);
        return;
      }

      const WidgetComponent = widget.component;

      context.modal.openModal({
        content: (
          <ModalFrameStructured
            header={
              <div className="flex items-center gap-2">
                {widget.icon && <widget.icon size={20} />}
                <h2 className="text-lg font-semibold">{widget.label}</h2>
                <div className="ml-auto">
                  <WidgetModalActions widgetId={widget.id} />
                </div>
              </div>
            }
            body={
              <div className="h-full min-h-[400px]">
                <WidgetComponent widgetId={widget.id} slotId="center" />
              </div>
            }
          />
        ),
        alignment: "top",
        size: "2xl",
        showBackdrop: true,
      });
      return;
    }

    // Show picker
    const eligibleWidgets = getEligibleWidgets();

    if (eligibleWidgets.length === 0) {
      return;
    }

    const widgetItems: MenuItem[] = eligibleWidgets.map((widget) => ({
      id: widget.id,
      icon: widget.icon,
      label: widget.label,
      subtitle: `Open ${widget.label} in modal`,
      onExecute: () => {
        context.modal.closeModal();
        context.commands.dispatch("widget.openInModal", {
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
