// =============================================================================
// SET LAYER VISIBILITY ACTION
// =============================================================================

import { Eye } from "lucide-react";
import { useLayerStore } from "../../layers/layer-store";
import { defineCommand } from "../defineCommand";

export interface SetLayerVisibilityPayload {
  layerId: string;
  visible: boolean;
}

export const layerSetVisibility = defineCommand<SetLayerVisibilityPayload>({
  id: "layer.setVisibility",
  name: "Set Layer Visibility",
  icon: Eye,
  hidden: true,
  execute: (_context, payload) => {
    if (!payload?.layerId || payload?.visible === undefined) {
      console.warn(
        "layer.setVisibility requires payload: { layerId, visible }",
      );
      return;
    }

    useLayerStore.getState().setLayerVisible(payload.layerId, payload.visible);
  },
});
