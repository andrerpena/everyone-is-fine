// =============================================================================
// PATHFINDING SCHEMA
// =============================================================================

import { nu } from "../core";

/**
 * Schema for pathfinding data in the inspector
 */
export const pathfindingDataSchema = nu
  .object({
    isPassable: nu.boolean().withMetadata({
      label: "Passable",
      editable: false,
    }),
    movementCost: nu.number().withMetadata({
      label: "Movement Cost",
      editable: false,
    }),
  })
  .withFormLayouts({
    default: {
      type: "form",
      groups: [
        {
          label: "Pathfinding",
          fields: [
            { name: "isPassable", fieldWidth: 6 },
            { name: "movementCost", fieldWidth: 6 },
          ],
        },
      ],
    },
  });
