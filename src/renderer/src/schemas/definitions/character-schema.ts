// =============================================================================
// CHARACTER ENTITY SCHEMA
// =============================================================================

import { Focus, MousePointer } from "lucide-react";
import { nu } from "../core";

/**
 * Schema for character entities displayed in the Characters widget.
 * Defines both the data structure and available actions.
 */
export const characterSchema = nu
  .object({
    id: nu.string().withMetadata({
      label: "ID",
      renderer: "readonly",
      editable: false,
    }),
    name: nu.string().withMetadata({
      label: "Name",
    }),
    type: nu.string().withMetadata({
      label: "Type",
    }),
    position: nu.string().withMetadata({
      label: "Position",
      renderer: "readonly",
    }),
  })
  .withActions({
    primaryAction: "focus",
    actions: [
      {
        id: "select",
        label: "Select",
        icon: MousePointer,
        commandId: "character.select",
        argsMapper: (entity) => ({
          characterIds: [(entity as { id: string }).id],
        }),
        showInRowMenu: true,
        showInToolbar: false,
      },
      {
        id: "focus",
        label: "Focus",
        icon: Focus,
        commandId: "character.focus",
        argsMapper: (entity) => ({
          characterIds: [(entity as { id: string }).id],
        }),
        showInRowMenu: true,
        showInToolbar: false,
      },
    ],
  });
