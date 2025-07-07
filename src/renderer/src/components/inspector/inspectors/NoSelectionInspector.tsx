// =============================================================================
// NO SELECTION INSPECTOR
// =============================================================================

/**
 * Displayed when nothing is selected
 */
export function NoSelectionInspector() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-8 px-4 text-center">
      <div className="text-4xl mb-4 opacity-30">🔍</div>
      <h3 className="text-sm font-medium text-[var(--muted-foreground)] mb-2">
        No Selection
      </h3>
      <p className="text-xs text-[var(--muted-foreground)] opacity-70">
        Click on a tile in the world to inspect its properties
      </p>
    </div>
  );
}
