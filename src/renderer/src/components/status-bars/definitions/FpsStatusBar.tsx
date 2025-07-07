// =============================================================================
// FPS STATUS BAR
// =============================================================================

import { usePerformanceStore } from "@renderer/lib/performance-store";
import { Activity } from "lucide-react";
import { StatusBarButton } from "../StatusBarButton";
import type { StatusBarItemDefinition, StatusBarItemProps } from "../types";

/**
 * Status bar item displaying the current FPS (frames per second).
 * The FPS value is throttled (updated every 500ms) to reduce performance overhead.
 */
function FpsStatusBarComponent(_props: StatusBarItemProps) {
  const fps = usePerformanceStore((state) => state.fps);
  return (
    <StatusBarButton
      text={`${fps} FPS`}
      icon={Activity}
      commandId="widget.openInModal"
      commandArgs={{ widgetId: "performance" }}
    />
  );
}

// =============================================================================
// DEFINITION EXPORT
// =============================================================================

export const fpsStatusBar: StatusBarItemDefinition = {
  id: "fps",
  component: FpsStatusBarComponent,
  alignment: "right",
  priority: 100,
};
