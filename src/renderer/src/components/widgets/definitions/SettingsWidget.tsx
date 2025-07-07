import { Settings } from "lucide-react";
import type { WidgetComponentProps, WidgetDefinition } from "../types";
import { SettingsContent } from "./settings";

/**
 * Settings widget component.
 * Displays configuration editors with three tabs: Overrides, Defaults, Calculated.
 */
function SettingsWidget(_props: WidgetComponentProps) {
  return <SettingsContent />;
}

/**
 * Settings widget definition.
 * Closable widget that can be added to center slot.
 */
export const settingsWidget: WidgetDefinition = {
  id: "settings",
  label: "Settings",
  icon: Settings,
  component: SettingsWidget,
  placement: {
    pinned: true,
    allowedSlots: ["center"],
  },
  defaultSlot: "center",
  size: "wide",
};
