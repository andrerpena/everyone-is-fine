import { Check, ZoomIn } from "lucide-react";
import { SearchableTreeNavigator } from "../../components/command-palette";
import { ModalFrame } from "../../components/floating/modal";
import type { MenuItem } from "../../menu/types";
import { defineCommand } from "../defineCommand";

export type SetZoomPayload = {
  scale?: number;
};

// Preset zoom levels with their display labels
const ZOOM_PRESETS = [
  { scale: 2, label: "200%" },
  { scale: 1.5, label: "150%" },
  { scale: 1.25, label: "125%" },
  { scale: 1, label: "100%" },
  { scale: 0.75, label: "75%" },
  { scale: 0.5, label: "50%" },
] as const;

export const worldSetZoom = defineCommand<SetZoomPayload>({
  id: "world.setZoom",
  name: "Set Zoom Level",
  icon: ZoomIn,
  execute: (context, payload) => {
    // If scale is provided directly, set it
    if (payload?.scale !== undefined) {
      context.game.setZoom(payload.scale);
      return;
    }

    // Show picker with presets
    const currentZoom = context.game.getZoom();

    const zoomItems: MenuItem[] = ZOOM_PRESETS.map((preset) => {
      const isCurrentZoom = Math.abs(currentZoom - preset.scale) < 0.01;
      return {
        id: `zoom-${preset.scale}`,
        icon: isCurrentZoom ? Check : ZoomIn,
        label: preset.label,
        subtitle: isCurrentZoom
          ? "Current zoom level"
          : `Set zoom to ${preset.label}`,
        onExecute: () => {
          context.modal.closeAllModals();
          context.game.setZoom(preset.scale);
        },
      };
    });

    context.modal.openModal({
      content: (
        <ModalFrame>
          <SearchableTreeNavigator
            items={zoomItems}
            placeHolder="Select zoom level..."
          />
        </ModalFrame>
      ),
      alignment: "top",
      size: "lg",
      showBackdrop: true,
    });
  },
});
