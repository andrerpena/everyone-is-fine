// =============================================================================
// LAYER ENTITY SCHEMA
// =============================================================================

import { Eye, EyeOff, ToggleLeft } from "lucide-react";
import { nu } from "../core";

/**
 * Schema for layer entities displayed in the Layers widget.
 * Defines both the data structure and available actions.
 */
export const layerSchema = nu
  .object({
    id: nu.string().withMetadata({
      label: "ID",
      renderer: "readonly",
      editable: false,
    }),
    name: nu.string().withMetadata({
      label: "Name",
    }),
    category: nu.string().withMetadata({
      label: "Category",
    }),
    visible: nu.boolean().withMetadata({
      label: "Visible",
    }),
  })
  .withActions({
    primaryAction: "toggle",
    actions: [
      {
        id: "toggle",
        label: "Toggle Visibility",
        icon: ToggleLeft,
        commandId: "layer.toggleVisibility",
        argsMapper: (entity) => ({
          layerId: (entity as { id: string }).id,
        }),
        showInRowMenu: true,
        showInToolbar: false,
      },
      {
        id: "show",
        label: "Show",
        icon: Eye,
        commandId: "layer.setVisibility",
        argsMapper: (entity) => ({
          layerId: (entity as { id: string }).id,
          visible: true,
        }),
        showInRowMenu: true,
        showInToolbar: false,
      },
      {
        id: "hide",
        label: "Hide",
        icon: EyeOff,
        commandId: "layer.setVisibility",
        argsMapper: (entity) => ({
          layerId: (entity as { id: string }).id,
          visible: false,
        }),
        showInRowMenu: true,
        showInToolbar: false,
      },
    ],
  });
