// =============================================================================
// GAME TIME STATUS BAR
// =============================================================================

import { useGameStore } from "@renderer/game-state";
import { formatGameTime, WEATHER_LABELS } from "@renderer/simulation";
import { Clock } from "lucide-react";
import { StatusBarButton } from "../StatusBarButton";
import type { StatusBarItemDefinition, StatusBarItemProps } from "../types";

/**
 * Status bar item displaying the current in-game time.
 * Subscribes to simulation.currentTick so it updates as time advances.
 * The selector returns the formatted time string, so Zustand skips
 * re-renders when the string hasn't changed (i.e., between minute rollovers).
 */
function GameTimeStatusBarComponent(_props: StatusBarItemProps) {
  const timeText = useGameStore((state) => {
    if (!state.world) return null;
    // Reading currentTick ensures this selector re-evaluates when ticks advance.
    // Zustand only re-renders if the returned string actually changes.
    void state.simulation.currentTick;
    const temp = state.world.weather.temperature;
    const weatherLabel = WEATHER_LABELS[state.world.weather.type];
    return `${formatGameTime(state.world.time)} | ${weatherLabel} ${temp}°C`;
  });

  if (!timeText) {
    return <StatusBarButton text="No world" icon={Clock} />;
  }

  return <StatusBarButton text={timeText} icon={Clock} />;
}

// =============================================================================
// DEFINITION EXPORT
// =============================================================================

export const gameTimeStatusBar: StatusBarItemDefinition = {
  id: "game-time",
  component: GameTimeStatusBarComponent,
  alignment: "left",
  priority: 90, // Before version (100)
};
