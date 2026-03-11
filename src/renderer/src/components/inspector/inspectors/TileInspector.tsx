// =============================================================================
// TILE INSPECTOR
// =============================================================================

import { useSelectedTile } from "../../../game-state";
import { type TileInspectorData, tileInspectorSchema } from "../../../schemas";
import type { ItemData } from "../../../world/types";
import { InspectorForm } from "../../schema-form";

/** Format an items array into a human-readable summary string */
function formatItemsSummary(items: ItemData[]): string {
  if (items.length === 0) return "None";
  return items.map((item) => `${item.type} x${item.quantity}`).join(", ");
}

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
    items: formatItemsSummary(tile.items),
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
