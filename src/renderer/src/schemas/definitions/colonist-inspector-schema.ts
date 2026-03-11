// =============================================================================
// COLONIST INSPECTOR SCHEMA
// =============================================================================

import { nu } from "../core";

/**
 * Schema for the colonist inspector panel.
 * Displays detailed information about a selected colonist.
 */
export const colonistInspectorSchema = nu
  .object({
    name: nu.string().withMetadata({
      label: "Name",
      renderer: "readonly",
      editable: false,
    }),
    age: nu.number().withMetadata({
      label: "Age",
      renderer: "readonly",
      editable: false,
    }),
    gender: nu.string().withMetadata({
      label: "Gender",
      renderer: "readonly",
      editable: false,
    }),
    position: nu.string().withMetadata({
      label: "Position",
      renderer: "readonly",
      editable: false,
    }),
    speed: nu.number().withMetadata({
      label: "Speed",
      unit: "tiles/s",
      renderer: "readonly",
      editable: false,
    }),
    isMoving: nu.boolean().withMetadata({
      label: "Moving",
      editable: false,
    }),
    controlMode: nu.string().withMetadata({
      label: "Mode",
      renderer: "readonly",
      editable: false,
    }),
    currentCommand: nu.string().withMetadata({
      label: "Command",
      renderer: "readonly",
      editable: false,
    }),
    hunger: nu.number().withMetadata({
      label: "Hunger",
      unit: "%",
      renderer: "percentage",
      editable: false,
    }),
    energy: nu.number().withMetadata({
      label: "Energy",
      unit: "%",
      renderer: "percentage",
      editable: false,
    }),
    mood: nu.number().withMetadata({
      label: "Mood",
      unit: "%",
      renderer: "percentage",
      editable: false,
    }),
  })
  .withFormLayouts({
    default: {
      type: "form",
      groups: [
        {
          label: "Identity",
          fields: [
            { name: "name", fieldWidth: 12 },
            { name: "age", fieldWidth: 6 },
            { name: "gender", fieldWidth: 6 },
          ],
        },
        {
          label: "Movement",
          fields: [
            { name: "position", fieldWidth: 12 },
            { name: "speed", fieldWidth: 6 },
            { name: "isMoving", fieldWidth: 6 },
          ],
        },
        {
          label: "Status",
          fields: [
            { name: "controlMode", fieldWidth: 6 },
            { name: "currentCommand", fieldWidth: 6 },
          ],
        },
        {
          label: "Needs",
          fields: [
            { name: "hunger", fieldWidth: 12 },
            { name: "energy", fieldWidth: 12 },
            { name: "mood", fieldWidth: 12 },
          ],
        },
      ],
    },
  });

/**
 * Type for colonist inspector data
 */
export interface ColonistInspectorData {
  name: string;
  age: number;
  gender: string;
  position: string;
  speed: number;
  isMoving: boolean;
  controlMode: string;
  currentCommand: string;
  hunger: number;
  energy: number;
  mood: number;
}
