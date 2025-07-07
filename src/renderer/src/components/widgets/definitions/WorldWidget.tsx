import { Map as MapIcon } from "lucide-react";
import { WorldWithControlBars } from "../../control-bars";
import type { WidgetComponentProps, WidgetDefinition } from "../types";

/**
 * World widget component.
 * Displays the main game world with control bars.
 */
function WorldWidget(_props: WidgetComponentProps) {
  return <WorldWithControlBars />;
}

/**
 * World widget definition.
 * This widget is pinned to center and cannot be removed or moved.
 */
export const worldWidget: WidgetDefinition = {
  id: "world",
  label: "World",
  icon: MapIcon,
  component: WorldWidget,
  placement: {
    pinned: true,
    unique: true,
  },
  defaultSlot: "center",
  size: "wide",
};
