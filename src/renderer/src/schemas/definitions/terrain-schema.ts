// =============================================================================
// TERRAIN SCHEMA
// =============================================================================

import type { TerrainType } from "../../world/types";
import { nu } from "../core";

/**
 * Terrain type options for enum renderer
 */
export const terrainTypeOptions: Array<{ label: string; value: TerrainType }> =
  [
    { label: "Soil", value: "soil" },
    { label: "Sand", value: "sand" },
    { label: "Clay", value: "clay" },
    { label: "Gravel", value: "gravel" },
    { label: "Rock", value: "rock" },
    { label: "Granite", value: "granite" },
    { label: "Limestone", value: "limestone" },
    { label: "Marble", value: "marble" },
    { label: "Obsidian", value: "obsidian" },
    { label: "Shallow Water", value: "water_shallow" },
    { label: "Deep Water", value: "water_deep" },
    { label: "Lava", value: "lava" },
    { label: "Void", value: "void" },
  ];

/**
 * Schema for terrain data in the inspector
 */
export const terrainDataSchema = nu
  .object({
    type: nu.string().withMetadata({
      label: "Terrain Type",
      renderer: "enum",
      enumValues: terrainTypeOptions,
      editable: false,
    }),
    moisture: nu.number().withMetadata({
      label: "Moisture",
      description: "Water content in the terrain",
      unit: "%",
      renderer: "percentage",
      editable: false,
    }),
    temperature: nu.number().withMetadata({
      label: "Temperature",
      unit: "°C",
      editable: false,
    }),
  })
  .withFormLayouts({
    default: {
      type: "form",
      groups: [
        {
          label: "Terrain",
          fields: [
            { name: "type", fieldWidth: 12 },
            { name: "moisture", fieldWidth: 6 },
            { name: "temperature", fieldWidth: 6 },
          ],
        },
      ],
    },
  });
