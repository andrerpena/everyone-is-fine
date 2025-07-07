// Core exports

// Widget definitions (for direct import if needed)
export * from "./definitions";
export { registerBuiltInWidgets } from "./register-widgets";
export { SlotAddWidgetMenu } from "./SlotAddWidgetMenu";
export { SLOT_LABELS } from "./slot-labels";
// Types
export type {
  WidgetComponentProps,
  WidgetDefinition,
  WidgetId,
  WidgetLayoutConfig,
  WidgetSlotId,
} from "./types";
export { WidgetModalActions } from "./WidgetModalActions";
export { WidgetSlot } from "./WidgetSlot";
export { WidgetTabContextMenu } from "./WidgetTabContextMenu";
export {
  useIsSlotEmpty,
  useWidgetLayoutStore,
  useWidgetsForSlot,
} from "./widget-layout-store";
export { widgetRegistry } from "./widget-registry";
