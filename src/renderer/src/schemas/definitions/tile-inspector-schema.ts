// =============================================================================
// TILE INSPECTOR SCHEMA
// =============================================================================

import { nu } from "../core";
import { structureTypeOptions } from "./structure-schema";
import { terrainTypeOptions } from "./terrain-schema";

/**
 * Main tile inspector schema
 */
export const tileInspectorSchema = nu
  .object({
    position: nu.string().withMetadata({
      label: "Position",
      renderer: "readonly",
      editable: false,
    }),
    zLevel: nu.number().withMetadata({
      label: "Z-Level",
      renderer: "readonly",
      editable: false,
    }),
    terrainType: nu.string().withMetadata({
      label: "Terrain",
      renderer: "enum",
      enumValues: terrainTypeOptions,
      editable: false,
    }),
    moisture: nu.number().withMetadata({
      label: "Moisture",
      unit: "%",
      renderer: "percentage",
      editable: false,
    }),
    temperature: nu.number().withMetadata({
      label: "Temperature",
      unit: "°C",
      editable: false,
    }),
    hasStructure: nu.boolean().withMetadata({
      label: "Has Structure",
      editable: false,
    }),
    structureType: nu.string().optional().withMetadata({
      label: "Structure",
      renderer: "enum",
      enumValues: structureTypeOptions,
      editable: false,
    }),
    itemCount: nu.number().withMetadata({
      label: "Items",
      editable: false,
    }),
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
          label: "Location",
          fields: [
            { name: "position", fieldWidth: 6 },
            { name: "zLevel", fieldWidth: 6 },
          ],
        },
        {
          label: "Terrain",
          fields: [
            { name: "terrainType", fieldWidth: 12 },
            { name: "moisture", fieldWidth: 6 },
            { name: "temperature", fieldWidth: 6 },
          ],
        },
        {
          label: "Structure",
          fields: [
            { name: "hasStructure", fieldWidth: 6 },
            { name: "structureType", fieldWidth: 6 },
          ],
        },
        {
          label: "Properties",
          fields: [
            { name: "itemCount", fieldWidth: 12 },
            { name: "isPassable", fieldWidth: 6 },
            { name: "movementCost", fieldWidth: 6 },
          ],
        },
      ],
    },
  });

/**
 * Type for tile inspector data
 */
export interface TileInspectorData {
  position: string;
  zLevel: number;
  terrainType: string;
  moisture: number;
  temperature: number;
  hasStructure: boolean;
  structureType?: string;
  itemCount: number;
  isPassable: boolean;
  movementCost: number;
}
