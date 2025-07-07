// =============================================================================
// STRING FIELD RENDERER
// =============================================================================

import type { FieldRendererProps } from "../types";

/**
 * Renders a string field value
 */
export function StringRenderer({ value, metadata }: FieldRendererProps) {
  const displayValue = value != null ? String(value) : "—";
  const unit = metadata.unit ?? "";

  return (
    <span className="text-sm text-[var(--foreground)]">
      {displayValue}
      {unit && (
        <span className="text-[var(--muted-foreground)] ml-1">{unit}</span>
      )}
    </span>
  );
}
