// =============================================================================
// TIME CONTROLS COMPONENT
// =============================================================================

import { Pause, Play } from "lucide-react";
import type React from "react";
import {
  useIsPlaying,
  useSimulationSpeed,
  useTimeControls,
} from "../../game-state";
import type { SimulationSpeed } from "../../simulation/types";

// =============================================================================
// SPEED BUTTON COMPONENT
// =============================================================================

interface SpeedButtonProps {
  speed: SimulationSpeed;
  currentSpeed: SimulationSpeed;
  onClick: (speed: SimulationSpeed) => void;
}

const SpeedButton: React.FC<SpeedButtonProps> = ({
  speed,
  currentSpeed,
  onClick,
}) => {
  const isActive = speed === currentSpeed;

  return (
    <button
      type="button"
      onClick={() => onClick(speed)}
      className={`
        pointer-events-auto px-2 py-1 rounded text-xs font-mono
        transition-colors
        ${
          isActive
            ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
            : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
        }
      `}
      title={`Set speed to ${speed}x`}
    >
      {speed}x
    </button>
  );
};

// =============================================================================
// TIME CONTROLS COMPONENT
// =============================================================================

export const TimeControls: React.FC = () => {
  const isPlaying = useIsPlaying();
  const speed = useSimulationSpeed();
  const { togglePlayPause, setSpeed } = useTimeControls();

  return (
    <div className="flex items-center gap-2">
      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlayPause}
        className={`
          pointer-events-auto flex items-center justify-center
          w-8 h-8 rounded-md transition-colors
          ${
            isPlaying
              ? "bg-[var(--destructive)] hover:bg-[var(--destructive)]/80"
              : "bg-[var(--primary)] hover:bg-[var(--primary)]/80"
          }
          text-[var(--primary-foreground)]
        `}
        title={isPlaying ? "Pause (Space)" : "Play (Space)"}
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>

      {/* Speed Controls */}
      <div className="flex items-center gap-1">
        <SpeedButton speed={1} currentSpeed={speed} onClick={setSpeed} />
        <SpeedButton speed={2} currentSpeed={speed} onClick={setSpeed} />
        <SpeedButton speed={4} currentSpeed={speed} onClick={setSpeed} />
      </div>
    </div>
  );
};

export default TimeControls;
