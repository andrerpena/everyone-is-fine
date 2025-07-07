import { type Infer, nu } from "../../schemas";
import { defineCommand } from "../defineCommand";

const setActiveTabSchema = nu.object({
  widgetId: nu.string().withMetadata({
    label: "Widget ID",
    description: "The ID of the widget to bring to front",
  }),
});

export type SetActiveTabPayload = Infer<typeof setActiveTabSchema>;

/**
 * Event command that WidgetSlot components subscribe to.
 * When dispatched, each WidgetSlot checks if it contains the widget
 * and sets it as active (brings it to front).
 */
export const widgetSetActiveTab = defineCommand<SetActiveTabPayload>({
  id: "widget.setActiveTab",
  name: "Set Active Widget Tab",
  payloadSchema: setActiveTabSchema,
  // No execute - this is an event that WidgetSlot subscribes to
});
