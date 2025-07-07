// =============================================================================
// ENTITY LIST WIDGET TYPES
// =============================================================================

import type { SelectableEntityType } from "../../../game-state/types";
import type { ObjectSchema, ObjectShape } from "../../../schemas/core/schema";

/**
 * Configuration for EntityListWidget
 */
export interface EntityListWidgetConfig<TShape extends ObjectShape> {
  /** Schema defining the entity structure and actions */
  schema: ObjectSchema<TShape>;
  /** Entity type for game state selection sync (optional when using custom checkbox handlers) */
  entityType?: SelectableEntityType;
  /** Function to get unique key from entity */
  getRowKey: (entity: Record<string, unknown>) => string;
  /** Optional columns to display (defaults to all schema fields) */
  visibleColumns?: (keyof TShape)[];
  /** Whether to show search input (default: true) */
  showSearch?: boolean;
  /** Placeholder for search input */
  searchPlaceholder?: string;
  /** Fields to search against (defaults to all string fields) */
  searchFields?: (keyof TShape)[];
  /** Whether multi-selection is enabled for game state (default: true) */
  multiSelect?: boolean;
  /** Whether to show checkbox column (default: false) */
  showCheckboxSelection?: boolean;
  /** Custom function to determine if a row's checkbox is checked (for toggle use cases like layer visibility) */
  isRowChecked?: (row: Record<string, unknown>) => boolean;
  /** Custom handler called when a row's checkbox is toggled (simpler than Set-based API) */
  onRowCheckboxToggle?: (key: string, checked: boolean) => void;
}

/**
 * Props for EntityListWidget
 */
export interface EntityListWidgetProps<TShape extends ObjectShape> {
  /** Widget configuration */
  config: EntityListWidgetConfig<TShape>;
  /** Data to display */
  data: Record<string, unknown>[];
  /** Loading state */
  isLoading?: boolean;
}
