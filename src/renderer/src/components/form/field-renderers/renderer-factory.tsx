import type { AnyFieldApi } from "@tanstack/react-form";
import type { BaseSchema, SchemaMetadata } from "../../../schemas";
import { FormControl } from "../../form-controls";
import { BooleanFieldRenderer } from "./BooleanFieldRenderer";
import { NumberFieldRenderer } from "./NumberFieldRenderer";
import { StringFieldRenderer } from "./StringFieldRenderer";
import type { EditFieldRenderer, EditFieldRendererMap } from "./types";

/**
 * Unsupported field renderer - shows a placeholder for unknown schema types.
 */
const UnsupportedFieldRenderer: EditFieldRenderer = ({ schema }) => {
  const element = (
    <div className="text-muted-foreground text-sm italic">
      Unsupported field type: {schema.type}
    </div>
  );
  return { element };
};

/**
 * Map of schema type to edit field renderer.
 */
const editFieldRenderers: EditFieldRendererMap = {
  string: StringFieldRenderer,
  number: NumberFieldRenderer,
  boolean: BooleanFieldRenderer,
};

/**
 * Resolves the appropriate edit renderer based on schema type.
 */
const resolveEditRenderer = (schemaType: string): EditFieldRenderer => {
  if (editFieldRenderers[schemaType]) {
    return editFieldRenderers[schemaType];
  }
  return UnsupportedFieldRenderer;
};

/**
 * Context for field rendering.
 */
export interface FormFieldRendererContext {
  schema: BaseSchema<unknown>;
  fieldState: AnyFieldApi;
  metadata: SchemaMetadata<unknown>;
  hasError: boolean;
  isRequired: boolean;
  /** Whether this field should be auto-focused on mount */
  autoFocus?: boolean;
}

/**
 * Creates the raw edit field element (without FormControl wrapper).
 */
const createRawEditRenderer = (context: FormFieldRendererContext) => {
  const renderer = resolveEditRenderer(context.schema.type);
  return renderer({
    schema: context.schema,
    fieldState: context.fieldState,
    hasError: context.hasError,
    metadata: context.metadata,
    autoFocus: context.autoFocus,
  });
};

/**
 * Creates an edit field wrapped in FormControl with label, hint, and validation.
 */
export const createEditRenderer = (context: FormFieldRendererContext) => {
  const result = createRawEditRenderer(context);

  const element = (
    <FormControl
      label={context.metadata.label}
      hint={context.metadata.description}
      field={context.fieldState}
      required={context.isRequired}
    >
      {result.element}
    </FormControl>
  );

  return { element, lifecycle: result.lifecycle };
};

/**
 * Creates a field renderer for the given context.
 * Currently only supports "edit" mode, but can be extended for "view" and "patch" modes.
 */
export const createFieldRenderer = (
  _mode: string,
  context: FormFieldRendererContext,
) => {
  // Currently only edit mode is supported
  // Future: Add view and patch modes
  return createEditRenderer(context).element;
};
