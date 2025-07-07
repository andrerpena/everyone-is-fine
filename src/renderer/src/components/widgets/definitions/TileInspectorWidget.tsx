import { Grid2X2 } from "lucide-react";
import { useSelectedTile } from "../../../game-state";
import { type TileInspectorData, tileInspectorSchema } from "../../../schemas";
import { InspectorForm } from "../../schema-form";
import type { WidgetComponentProps, WidgetDefinition } from "../types";

/**
 * TileInspector widget component.
 * Displays properties of the currently selected tile.
 */
function TileInspectorWidget(_props: WidgetComponentProps) {
  const selectedTile = useSelectedTile();

  if (!selectedTile) {
    return (
      <div className="p-4 text-sm text-[var(--muted-foreground)]">
        No tile selected
      </div>
    );
  }

  const { position, zLevel, tile } = selectedTile;

  // Transform tile data to inspector format
  const data: TileInspectorData = {
    position: `(${position.x}, ${position.y})`,
    zLevel,
    terrainType: tile.terrain.type,
    moisture: tile.terrain.moisture,
    temperature: tile.terrain.temperature,
    hasStructure: tile.structure !== null && tile.structure.type !== "none",
    structureType: tile.structure?.type,
    itemCount: tile.items.length,
    isPassable: tile.pathfinding.isPassable,
    movementCost: tile.pathfinding.movementCost,
  };

  return (
    <div className="p-3">
      <InspectorForm
        schema={tileInspectorSchema}
        data={data}
        layout="default"
      />
    </div>
  );
}

/**
 * TileInspector widget definition.
 */
export const tileInspectorWidget: WidgetDefinition = {
  id: "tile-inspector",
  label: "Tile",
  icon: Grid2X2,
  component: TileInspectorWidget,
};
