// =============================================================================
// STATUS BAR COMPONENT
// =============================================================================

import { useStatusBarLayoutConfig } from "@renderer/config";
import { statusBarRegistry } from "./status-bar-registry";

/**
 * Status bar container that renders all registered status bar items.
 * Items are grouped by alignment (left/right) and sorted by priority.
 * Subscribes to config to re-render when status bar config changes.
 */
export function StatusBar() {
  // Subscribe to config changes to trigger re-renders
  useStatusBarLayoutConfig();

  const leftItems = statusBarRegistry.getByAlignment("left");
  const rightItems = statusBarRegistry.getByAlignment("right");

  // Don't render if no items are registered
  if (leftItems.length === 0 && rightItems.length === 0) {
    return null;
  }

  const renderItemsWithSeparators = (
    items: typeof leftItems,
  ): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    items.forEach((item, index) => {
      if (index > 0) {
        result.push(
          <span key={`sep-${item.id}`} className="text-border">
            |
          </span>,
        );
      }
      result.push(<item.component key={item.id} itemId={item.id} />);
    });
    return result;
  };

  return (
    <div className="flex items-center justify-between w-full h-6 px-2 text-xs text-muted-foreground bg-background">
      {/* Left-aligned items */}
      <div className="flex items-center gap-2">
        {renderItemsWithSeparators(leftItems)}
      </div>

      {/* Right-aligned items */}
      <div className="flex items-center gap-2">
        {renderItemsWithSeparators(rightItems)}
      </div>
    </div>
  );
}
