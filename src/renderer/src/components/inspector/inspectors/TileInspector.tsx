// =============================================================================
// TILE INSPECTOR
// =============================================================================

import { useSelectedTile } from "../../../game-state";
import { type TileInspectorData, tileInspectorSchema } from "../../../schemas";
import { InspectorForm } from "../../schema-form";

/**
 * Inspector for displaying tile properties
 */
export function TileInspector() {
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
