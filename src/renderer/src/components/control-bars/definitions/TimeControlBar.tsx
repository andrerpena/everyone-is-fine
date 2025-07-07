// =============================================================================
// TIME CONTROL BAR
// =============================================================================

import { Pause, Play } from "lucide-react";
import {
  useIsPlaying,
  useSimulationSpeed,
  useTimeControls,
} from "../../../game-state";
import type { SimulationSpeed } from "../../../simulation/types";
import type { ControlBarDefinition, ControlBarProps } from "../types";

// =============================================================================
// SHARED BUTTON STYLES
// =============================================================================

const baseButtonClass =
  "flex items-center justify-center w-7 h-7 rounded-md text-xs font-mono transition-colors";

const activeButtonClass = "bg-primary text-primary-foreground";
const inactiveButtonClass = "bg-muted/50 text-muted-foreground hover:bg-muted";

// =============================================================================
// SPEED BUTTON COMPONENT
// =============================================================================

interface SpeedButtonProps {
  speed: SimulationSpeed;
  currentSpeed: SimulationSpeed;
  onClick: (speed: SimulationSpeed) => void;
}

function SpeedButton({ speed, currentSpeed, onClick }: SpeedButtonProps) {
  const isActive = speed === currentSpeed;

  return (
    <button
      type="button"
      onClick={() => onClick(speed)}
      className={`${baseButtonClass} ${isActive ? activeButtonClass : inactiveButtonClass}`}
      title={`Set speed to ${speed}x`}
    >
      {speed}x
    </button>
  );
}

// =============================================================================
// TIME CONTROL BAR COMPONENT
// =============================================================================

function TimeControlBarComponent(_props: ControlBarProps) {
  const isPlaying = useIsPlaying();
  const speed = useSimulationSpeed();
  const { togglePlayPause, setSpeed } = useTimeControls();

  return (
    <div className="flex items-center gap-2 px-1.5 py-1.5 rounded-lg bg-background/70 backdrop-blur-sm border border-border/50 shadow-lg">
      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlayPause}
        className={`${baseButtonClass} ${isPlaying ? activeButtonClass : inactiveButtonClass}`}
        title={isPlaying ? "Pause (Space)" : "Play (Space)"}
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
      </button>

      {/* Speed Controls */}
      <div className="flex items-center gap-1">
        <SpeedButton speed={1} currentSpeed={speed} onClick={setSpeed} />
        <SpeedButton speed={2} currentSpeed={speed} onClick={setSpeed} />
        <SpeedButton speed={4} currentSpeed={speed} onClick={setSpeed} />
      </div>
    </div>
  );
}

// =============================================================================
// DEFINITION EXPORT
// =============================================================================

export const timeControlBar: ControlBarDefinition = {
  id: "time-control",
  component: TimeControlBarComponent,
};
