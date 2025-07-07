// =============================================================================
// PROPERTY INSPECTOR COMPONENT
// =============================================================================

import { useSelectionType } from "../../game-state";
import { NoSelectionInspector } from "./inspectors/NoSelectionInspector";
import { TileInspector } from "./inspectors/TileInspector";

/**
 * Header component for the inspector
 */
function InspectorHeader({ title }: { title: string }) {
  return (
    <div className="px-3 py-2 border-b border-[var(--border)] bg-[var(--card)]">
      <h2 className="text-sm font-semibold text-[var(--foreground)]">
        {title}
      </h2>
    </div>
  );
}

/**
 * Main property inspector component
 *
 * Displays properties of the currently selected item (tile, entity, etc.)
 * based on the selection type.
 */
export function PropertyInspector() {
  const selectionType = useSelectionType();

  // Get the appropriate inspector based on selection type
  const renderInspector = () => {
    switch (selectionType) {
      case "tile":
        return <TileInspector />;
      case "entity":
        // TODO: Implement EntityInspector when entities are added
        return (
          <div className="p-4 text-sm text-[var(--muted-foreground)]">
            Entity inspector coming soon
          </div>
        );
      default:
        return <NoSelectionInspector />;
    }
  };

  // Get the title based on selection type
  const getTitle = () => {
    switch (selectionType) {
      case "tile":
        return "Tile Inspector";
      case "entity":
        return "Entity Inspector";
      default:
        return "Inspector";
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--background)]">
      <InspectorHeader title={getTitle()} />
      <div className="flex-1 overflow-y-auto">{renderInspector()}</div>
    </div>
  );
}
