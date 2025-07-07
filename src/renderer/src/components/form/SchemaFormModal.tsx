import type { Infer, ObjectSchema, ObjectShape } from "../../schemas";
import { ModalFrameStructured } from "../floating/modal/ModalFrameStructured";
import { SchemaFormBody } from "./SchemaFormBody";
import { useSchemaForm } from "./useSchemaForm";

interface SchemaFormModalProps<TSchema extends ObjectSchema<ObjectShape>> {
  schema: TSchema;
  title: string;
  onSubmit: (data: Infer<TSchema>) => void;
  onCancel: () => void;
  submitText?: string;
  cancelText?: string;
}

/**
 * Modal component that renders a form from a schema.
 * Uses ModalFrameStructured for proper header/body/footer layout with
 * scrollable body and fixed footer.
 */
export function SchemaFormModal<TSchema extends ObjectSchema<ObjectShape>>({
  schema,
  title,
  onSubmit,
  onCancel,
  submitText = "Execute",
  cancelText = "Cancel",
}: SchemaFormModalProps<TSchema>) {
  const form = useSchemaForm({
    schema,
    onSubmit,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    form.api.handleSubmit();
  };

  return (
    <form onSubmit={handleSubmit}>
      <ModalFrameStructured
        data-testid="schema-form-modal"
        header={
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        }
        body={<SchemaFormBody form={form} />}
        footer={
          <div className="flex justify-end gap-2 p-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
            >
              {cancelText}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors"
            >
              {submitText}
            </button>
          </div>
        }
      />
    </form>
  );
}
