// =============================================================================
// STRUCTURE SCHEMA
// =============================================================================

import type { StructureType } from "../../world/types";
import { nu } from "../core";

/**
 * Structure type options for enum renderer
 */
export const structureTypeOptions: Array<{
  label: string;
  value: StructureType;
}> = [
  { label: "None", value: "none" },
  { label: "Stone Wall", value: "wall_stone" },
  { label: "Wood Wall", value: "wall_wood" },
  { label: "Metal Wall", value: "wall_metal" },
  { label: "Brick Wall", value: "wall_brick" },
  { label: "Wood Door", value: "door_wood" },
  { label: "Metal Door", value: "door_metal" },
  { label: "Auto Door", value: "door_auto" },
  { label: "Bed", value: "bed" },
  { label: "Chair", value: "chair" },
  { label: "Table", value: "table" },
  { label: "Workbench", value: "workbench" },
  { label: "Chest", value: "chest" },
  { label: "Shelf", value: "shelf" },
  { label: "Stockpile Zone", value: "stockpile_zone" },
  { label: "Oak Tree", value: "tree_oak" },
  { label: "Pine Tree", value: "tree_pine" },
  { label: "Bush", value: "bush" },
  { label: "Boulder", value: "boulder" },
];

/**
 * Schema for structure data in the inspector
 */
export const structureDataSchema = nu
  .object({
    type: nu.string().withMetadata({
      label: "Type",
      renderer: "enum",
      enumValues: structureTypeOptions,
      editable: false,
    }),
    health: nu.number().withMetadata({
      label: "Health",
      editable: false,
    }),
    rotation: nu.number().withMetadata({
      label: "Rotation",
      unit: "°",
      editable: false,
    }),
  })
  .withFormLayouts({
    default: {
      type: "form",
      groups: [
        {
          fields: [
            { name: "type", fieldWidth: 12 },
            { name: "health", fieldWidth: 6 },
            { name: "rotation", fieldWidth: 6 },
          ],
        },
      ],
    },
  });
