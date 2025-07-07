// =============================================================================
// VERSION STATUS BAR
// =============================================================================

import { Tag } from "lucide-react";
import { StatusBarButton } from "../StatusBarButton";
import type { StatusBarItemDefinition, StatusBarItemProps } from "../types";

/**
 * Status bar item displaying the application version
 */
function VersionStatusBarComponent(_props: StatusBarItemProps) {
  return <StatusBarButton text={`v${__APP_VERSION__}`} icon={Tag} />;
}

// =============================================================================
// DEFINITION EXPORT
// =============================================================================

export const versionStatusBar: StatusBarItemDefinition = {
  id: "version",
  component: VersionStatusBarComponent,
  alignment: "left",
  priority: 100,
};
