import type { BaseSchema, ObjectSchema, ObjectShape } from "../../schemas";
import { FormFieldRenderer } from "./FormFieldRenderer";
import type { SchemaFormConfiguration } from "./useSchemaForm";

interface SchemaFormBodyProps {
  form: SchemaFormConfiguration<ObjectSchema<ObjectShape>>;
  className?: string;
  /** Whether to auto-focus the first field */
  autoFocusFirst?: boolean;
}

/**
 * Renders all fields from an ObjectSchema using TanStack Form.
 * Each field is rendered with horizontal label layout via FormControl.
 */
export function SchemaFormBody({
  form,
  className = "",
  autoFocusFirst = true,
}: SchemaFormBodyProps) {
  const { schema } = form;
  const shape = schema.getShape();
  const fieldKeys = Object.keys(shape);

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex-1 space-y-2">
        {fieldKeys.map((fieldName, index) => {
          const fieldSchema = shape[fieldName] as BaseSchema<unknown>;
          const isFirstField = index === 0;

          return (
            <div key={fieldName}>
              <form.api.Field name={fieldName}>
                {(fieldState) => (
                  <FormFieldRenderer
                    schema={fieldSchema}
                    fieldState={fieldState}
                    metadata={fieldSchema._meta}
                    autoFocus={autoFocusFirst && isFirstField}
                  />
                )}
              </form.api.Field>
              {/* Separator between fields */}
              {index < fieldKeys.length - 1 && (
                <div className="border-t border-border my-2" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
