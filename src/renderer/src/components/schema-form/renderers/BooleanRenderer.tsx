// =============================================================================
// BOOLEAN FIELD RENDERER
// =============================================================================

import type { FieldRendererProps } from "../types";

/**
 * Renders a boolean field value
 */
export function BooleanRenderer({ value }: FieldRendererProps) {
  const boolValue = Boolean(value);

  return (
    <span
      className={`text-sm font-medium ${
        boolValue
          ? "text-green-500 dark:text-green-400"
          : "text-red-500 dark:text-red-400"
      }`}
    >
      {boolValue ? "Yes" : "No"}
    </span>
  );
}
