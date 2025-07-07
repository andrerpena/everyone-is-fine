// =============================================================================
// RUN COMMAND STATUS BAR
// =============================================================================

import { Terminal } from "lucide-react";
import { StatusBarButton } from "../StatusBarButton";
import type { StatusBarItemDefinition, StatusBarItemProps } from "../types";

/**
 * Status bar item that opens the command palette.
 */
function RunCommandStatusBarComponent(_props: StatusBarItemProps) {
  return (
    <StatusBarButton
      text="Run Command"
      icon={Terminal}
      commandId="workbench.runCommand"
    />
  );
}

// =============================================================================
// DEFINITION EXPORT
// =============================================================================

export const runCommandStatusBar: StatusBarItemDefinition = {
  id: "run-command",
  component: RunCommandStatusBarComponent,
  alignment: "left",
  priority: 150, // Between version (100) and theme (200)
};
