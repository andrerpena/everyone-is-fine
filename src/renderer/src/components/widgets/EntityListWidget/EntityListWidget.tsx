// =============================================================================
// ENTITY LIST WIDGET COMPONENT
// =============================================================================

import { Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useColony } from "../../../context/ColonyContext";
import {
  useMultiSelectionActions,
  useSelectedEntityIds,
} from "../../../game-state";
import type { SchemaAction } from "../../../schemas/core/actions";
import type { ObjectShape } from "../../../schemas/core/schema";
import { type Column, DataGrid, SelectColumn } from "../../data-grid";
import { ActionsDropdown } from "./ActionsDropdown";
import type { EntityListWidgetConfig } from "./types";

interface EntityListWidgetProps<TShape extends ObjectShape> {
  config: EntityListWidgetConfig<TShape>;
  data: Record<string, unknown>[];
}

export function EntityListWidget<TShape extends ObjectShape>({
  config,
  data,
}: EntityListWidgetProps<TShape>) {
  const {
    schema,
    entityType,
    getRowKey,
    showSearch = true,
    searchPlaceholder = "Search...",
    searchFields,
    multiSelect = true,
    showCheckboxSelection = false,
    isRowChecked,
    onRowCheckboxToggle,
  } = config;

  // Determine if we're using custom toggle mode (for things like layer visibility)
  const useCustomToggle =
    isRowChecked !== undefined && onRowCheckboxToggle !== undefined;

  const [searchQuery, setSearchQuery] = useState("");
  const { commands } = useColony();
  const selectedIds = useSelectedEntityIds();
  const { selectMultiple } = useMultiSelectionActions();

  // Execute schema action
  const executeAction = useCallback(
    (action: SchemaAction, entity: Record<string, unknown>) => {
      let payload: unknown;

      if (typeof action.argsMapper === "function") {
        payload = action.argsMapper(entity);
      } else if (typeof action.argsMapper === "string") {
        payload = { [action.argsMapper]: entity[action.argsMapper] };
      }

      // Dispatch command - schema actions use commandId
      commands.dispatch(action.commandId, payload);
    },
    [commands],
  );

  // Derive columns from schema
  const columns = useMemo(() => {
    const shape = schema.getShape();
    const visibleFields = config.visibleColumns ?? Object.keys(shape);

    const cols: Column<Record<string, unknown>>[] = visibleFields.map(
      (fieldKey) => {
        const fieldSchema = shape[fieldKey as string];
        const meta = fieldSchema?._meta ?? {};

        return {
          key: fieldKey as string,
          name: meta.label ?? String(fieldKey),
          width: 100,
          renderCell: ({ row }) => {
            const value = row[fieldKey as string];
            // Use renderer from metadata if specified
            if (meta.renderer === "readonly") {
              return (
                <span className="text-muted-foreground">{String(value)}</span>
              );
            }
            return String(value ?? "");
          },
        };
      },
    );

    // Add actions column if schema has actions
    const actionsConfig = schema.getActions();
    if (actionsConfig && actionsConfig.actions.length > 0) {
      const rowActions = actionsConfig.actions.filter(
        (a) => a.showInRowMenu !== false,
      );
      if (rowActions.length > 0) {
        cols.push({
          key: "__actions",
          name: "",
          width: 40,
          renderCell: ({ row }) => (
            <ActionsDropdown
              actions={rowActions}
              onActionExecute={(action) => executeAction(action, row)}
            />
          ),
        });
      }
    }

    return cols;
  }, [schema, config.visibleColumns, executeAction]);

  // Create custom toggle checkbox column for simple toggle use cases (like layer visibility)
  const customToggleColumn: Column<Record<string, unknown>> = useMemo(
    () => ({
      key: "__checkbox",
      name: "",
      width: 35,
      minWidth: 35,
      maxWidth: 35,
      resizable: false,
      sortable: false,
      frozen: true,
      renderCell: ({ row }) => {
        const key = getRowKey(row);
        const checked = isRowChecked?.(row) ?? false;
        return (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => onRowCheckboxToggle?.(key, e.target.checked)}
              className="h-4 w-4 cursor-pointer accent-primary"
              aria-label="Toggle"
            />
          </div>
        );
      },
    }),
    [getRowKey, isRowChecked, onRowCheckboxToggle],
  );

  // Build final columns list
  const columnsWithSelect = useMemo(() => {
    if (!showCheckboxSelection) return columns;
    // Use custom toggle column for simple toggle use cases, SelectColumn for game state selection
    if (useCustomToggle) {
      return [customToggleColumn, ...columns];
    }
    return [SelectColumn, ...columns];
  }, [showCheckboxSelection, columns, useCustomToggle, customToggleColumn]);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    const fields = searchFields ?? Object.keys(schema.getShape());

    return data.filter((item) => {
      return fields.some((field) => {
        const value = item[field as string];
        return String(value ?? "")
          .toLowerCase()
          .includes(query);
      });
    });
  }, [data, searchQuery, searchFields, schema]);

  // Handle row double-click (primary action)
  const handleRowDoubleClick = useCallback(
    (row: Record<string, unknown>) => {
      const primaryAction = schema.getPrimaryAction();
      if (primaryAction) {
        executeAction(primaryAction, row);
      }
    },
    [schema, executeAction],
  );

  // Handle selection change (game state behavior - only used when not in custom toggle mode)
  const handleSelectedRowsChange = useCallback(
    (newSelected: Set<string>) => {
      if (entityType) {
        selectMultiple(entityType, Array.from(newSelected));
      }
    },
    [entityType, selectMultiple],
  );

  // Row class for highlighting selection
  const rowClass = useCallback(
    (row: Record<string, unknown>) => {
      if (useCustomToggle) {
        // In custom toggle mode, highlight checked rows
        return isRowChecked?.(row) ? "bg-cyan-900/30" : "";
      }
      // In game state mode, highlight selected rows
      const key = getRowKey(row);
      return selectedIds.has(key) ? "bg-cyan-900/30" : "";
    },
    [useCustomToggle, isRowChecked, getRowKey, selectedIds],
  );

  // Selection props - only used when not in custom toggle mode
  const selectionProps = useCustomToggle
    ? {}
    : {
        selectedRows: multiSelect ? selectedIds : undefined,
        onSelectedRowsChange: multiSelect
          ? handleSelectedRowsChange
          : undefined,
      };

  return (
    <div className="flex flex-col h-full">
      {showSearch && (
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      )}
      <div className="flex-1 min-h-0">
        <DataGrid
          style={{ height: "100%" }}
          columns={columnsWithSelect}
          rows={filteredData}
          rowKeyGetter={getRowKey}
          {...selectionProps}
          rowClass={rowClass}
          onCellDoubleClick={({ row }) => handleRowDoubleClick(row)}
        />
      </div>
    </div>
  );
}
