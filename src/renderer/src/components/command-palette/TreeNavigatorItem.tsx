import { ChevronRight } from "lucide-react";
import type { MenuItem } from "../../menu/types";

/**
 * Internal flattened representation of a MenuItem for rendering.
 * Adds hierarchy metadata needed for tree display.
 */
export interface FlatMenuItem extends MenuItem {
  level: number;
  parentId?: string;
  isExpanded?: boolean;
  hasChildren: boolean;
}

interface MenuItemComponentProps {
  item: FlatMenuItem;
  index: number;
  isSelected: boolean;
  onToggleExpanded: (itemId: string) => void;
  itemRef: (el: HTMLButtonElement | null) => void;
  "data-testid"?: string;
}

function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export const MenuItemComponent = ({
  item,
  isSelected,
  onToggleExpanded,
  itemRef,
  "data-testid": testId,
}: MenuItemComponentProps) => {
  const handleClick = () => {
    if (item.hasChildren) {
      onToggleExpanded(item.id);
    } else if (item.onExecute) {
      item.onExecute();
    }
  };

  const commonClassName = cn(
    "flex items-center gap-3 rounded-md py-2 pr-3 text-sm cursor-pointer w-full text-left transition-colors",
    isSelected
      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
      : "hover:bg-[var(--muted)] hover:text-[var(--muted-foreground)]",
  );

  const commonStyle = { paddingLeft: `${12 + item.level * 16}px` };

  // Instantiate icon if it's a component type
  const IconComponent = item.icon;
  const iconElement = IconComponent ? (
    <IconComponent size={16} className="flex-shrink-0" />
  ) : null;

  const content = (
    <>
      {iconElement && <div className="flex-shrink-0">{iconElement}</div>}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{item.label}</div>
        {item.subtitle && (
          <div
            className={cn(
              "text-xs truncate",
              isSelected
                ? "text-[var(--primary-foreground)]/80"
                : "text-[var(--muted-foreground)]",
            )}
          >
            {item.subtitle}
          </div>
        )}
      </div>
      {item.hasChildren && (
        <div className="flex-shrink-0">
          <div className="w-4 h-4 flex items-center justify-center">
            <ChevronRight
              size={12}
              className={cn(
                "transition-transform",
                item.isExpanded ? "rotate-90" : "rotate-0",
              )}
            />
          </div>
        </div>
      )}
    </>
  );

  return (
    <button
      key={item.id}
      ref={itemRef}
      type="button"
      className={commonClassName}
      style={commonStyle}
      onClick={handleClick}
      data-testid={testId}
    >
      {content}
    </button>
  );
};
