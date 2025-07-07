// =============================================================================
// INSPECTOR FORM STORIES
// =============================================================================

import type { Meta, StoryObj } from "@storybook/react";
import {
  nu,
  structureTypeOptions,
  type TileInspectorData,
  terrainTypeOptions,
  tileInspectorSchema,
} from "../../schemas";
import { InspectorForm } from "./InspectorForm";

const meta = {
  title: "Components/SchemaForm/InspectorForm",
  component: InspectorForm,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="w-80 bg-[var(--surface-1)] border border-[var(--border)] rounded-lg p-2">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InspectorForm>;

export default meta;

type Story = StoryObj<typeof InspectorForm>;

// =============================================================================
// TILE INSPECTOR STORY
// =============================================================================

const sampleTileData: TileInspectorData = {
  position: "(12, 34)",
  zLevel: 0,
  terrainType: "soil",
  moisture: 0.65,
  temperature: 22,
  hasStructure: true,
  structureType: "wall_stone",
  itemCount: 3,
  isPassable: false,
  movementCost: 1.5,
};

export const TileInspector: Story = {
  render: () => (
    <InspectorForm
      schema={tileInspectorSchema}
      data={sampleTileData}
      layout="default"
    />
  ),
};

// =============================================================================
// SIMPLE SCHEMA STORY
// =============================================================================

const simpleSchema = nu
  .object({
    name: nu.string().withMetadata({
      label: "Name",
      editable: true,
    }),
    age: nu.number().withMetadata({
      label: "Age",
      unit: "years",
      editable: true,
    }),
    active: nu.boolean().withMetadata({
      label: "Active",
      editable: true,
    }),
  })
  .withFormLayouts({
    default: {
      type: "form",
      groups: [
        {
          label: "Basic Info",
          fields: [
            { name: "name", fieldWidth: 12 },
            { name: "age", fieldWidth: 6 },
            { name: "active", fieldWidth: 6 },
          ],
        },
      ],
    },
  });

export const SimpleForm: Story = {
  render: () => (
    <InspectorForm
      schema={simpleSchema}
      data={{
        name: "John Doe",
        age: 30,
        active: true,
      }}
      layout="default"
    />
  ),
};

// =============================================================================
// NO LAYOUT STORY (FLAT LIST)
// =============================================================================

const noLayoutSchema = nu.object({
  field1: nu.string().withMetadata({ label: "Field 1" }),
  field2: nu.number().withMetadata({ label: "Field 2" }),
  field3: nu.boolean().withMetadata({ label: "Field 3" }),
});

export const NoLayout: Story = {
  render: () => (
    <InspectorForm
      schema={noLayoutSchema}
      data={{
        field1: "Hello",
        field2: 42,
        field3: true,
      }}
    />
  ),
};

// =============================================================================
// MULTIPLE GROUPS STORY
// =============================================================================

const multiGroupSchema = nu
  .object({
    firstName: nu
      .string()
      .withMetadata({ label: "First Name", editable: true }),
    lastName: nu.string().withMetadata({ label: "Last Name", editable: true }),
    email: nu.string().withMetadata({ label: "Email", editable: true }),
    phone: nu.string().withMetadata({ label: "Phone", editable: true }),
    street: nu.string().withMetadata({ label: "Street", editable: true }),
    city: nu.string().withMetadata({ label: "City", editable: true }),
    country: nu.string().withMetadata({ label: "Country", editable: true }),
  })
  .withFormLayouts({
    default: {
      type: "form",
      groups: [
        {
          label: "Personal",
          fields: [
            { name: "firstName", fieldWidth: 6 },
            { name: "lastName", fieldWidth: 6 },
          ],
        },
        {
          label: "Contact",
          fields: [
            { name: "email", fieldWidth: 12 },
            { name: "phone", fieldWidth: 12 },
          ],
        },
        {
          label: "Address",
          fields: [
            { name: "street", fieldWidth: 12 },
            { name: "city", fieldWidth: 6 },
            { name: "country", fieldWidth: 6 },
          ],
        },
      ],
    },
  });

export const MultipleGroups: Story = {
  render: () => (
    <InspectorForm
      schema={multiGroupSchema}
      data={{
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        phone: "+1 555-0123",
        street: "123 Main St",
        city: "San Francisco",
        country: "USA",
      }}
      layout="default"
    />
  ),
};

// =============================================================================
// WITH ENUM FIELDS STORY
// =============================================================================

const enumSchema = nu
  .object({
    terrain: nu.string().withMetadata({
      label: "Terrain Type",
      renderer: "enum",
      enumValues: terrainTypeOptions,
      editable: false,
    }),
    structure: nu.string().optional().withMetadata({
      label: "Structure Type",
      renderer: "enum",
      enumValues: structureTypeOptions,
      editable: false,
    }),
    moisture: nu.number().withMetadata({
      label: "Moisture",
      renderer: "percentage",
      unit: "%",
      editable: false,
    }),
  })
  .withFormLayouts({
    default: {
      type: "form",
      groups: [
        {
          label: "Terrain Properties",
          fields: [
            { name: "terrain", fieldWidth: 12 },
            { name: "structure", fieldWidth: 12 },
            { name: "moisture", fieldWidth: 12 },
          ],
        },
      ],
    },
  });

export const WithEnumFields: Story = {
  render: () => (
    <InspectorForm
      schema={enumSchema}
      data={{
        terrain: "granite",
        structure: "wall_stone",
        moisture: 0.35,
      }}
      layout="default"
    />
  ),
};

// =============================================================================
// INTERACTIVE (WITH ONCHANGE) STORY
// =============================================================================

export const Interactive: Story = {
  render: () => (
    <InspectorForm
      schema={simpleSchema}
      data={{
        name: "Editable User",
        age: 25,
        active: false,
      }}
      layout="default"
      onChange={(fieldName, value) => {
        console.log(`Field "${String(fieldName)}" changed to:`, value);
      }}
    />
  ),
};
