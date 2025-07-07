import { Layers } from "lucide-react";
import { useCallback, useMemo } from "react";
import { layerRegistry, useLayerStore } from "../../../layers";
import { layerSchema } from "../../../schemas";
import { EntityListWidget } from "../EntityListWidget";
import type { WidgetComponentProps, WidgetDefinition } from "../types";

function LayersWidget(_props: WidgetComponentProps) {
  const visibility = useLayerStore((state) => state.visibility);
  const setLayerVisible = useLayerStore((state) => state.setLayerVisible);

  // Transform layer definitions to row format
  const data = useMemo(() => {
    return layerRegistry.getAll().map((layer) => ({
      id: layer.id,
      name: layer.name,
      category: layer.category,
      visible: visibility.get(layer.id) ?? layer.defaultEnabled,
    }));
  }, [visibility]);

  // Check if a layer is visible (for checkbox state)
  const isRowChecked = useCallback(
    (row: Record<string, unknown>) => {
      const layer = layerRegistry.get(row.id as string);
      return visibility.get(row.id as string) ?? layer?.defaultEnabled ?? false;
    },
    [visibility],
  );

  // Handle checkbox toggle → update layer visibility directly
  const handleToggle = useCallback(
    (layerId: string, visible: boolean) => {
      setLayerVisible(layerId, visible);
    },
    [setLayerVisible],
  );

  return (
    <EntityListWidget
      config={{
        schema: layerSchema,
        getRowKey: (row) => row.id as string,
        visibleColumns: ["name", "category"],
        searchFields: ["name", "category"],
        searchPlaceholder: "Search layers...",
        showCheckboxSelection: true,
        isRowChecked,
        onRowCheckboxToggle: handleToggle,
      }}
      data={data}
    />
  );
}

export const layersWidget: WidgetDefinition = {
  id: "layers",
  label: "Layers",
  icon: Layers,
  component: LayersWidget,
};
