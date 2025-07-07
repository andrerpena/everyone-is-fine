// =============================================================================
// THEME STATUS BAR
// =============================================================================

import { useColony } from "@renderer/context/ColonyContext";
import { Palette } from "lucide-react";
import { StatusBarButton } from "../StatusBarButton";
import type { StatusBarItemDefinition, StatusBarItemProps } from "../types";

/**
 * Status bar item displaying the current theme.
 * Clicking it opens the theme selection modal.
 */
function ThemeStatusBarComponent(_props: StatusBarItemProps) {
  const { theming } = useColony();
  const themeName = theming.activeThemeId;

  // Capitalize first letter for display
  const displayName = themeName.charAt(0).toUpperCase() + themeName.slice(1);

  return (
    <StatusBarButton
      text={displayName}
      icon={Palette}
      commandId="workbench.setTheme"
    />
  );
}

// =============================================================================
// DEFINITION EXPORT
// =============================================================================

export const themeStatusBar: StatusBarItemDefinition = {
  id: "theme",
  component: ThemeStatusBarComponent,
  alignment: "left",
  priority: 200, // After version (100)
};
