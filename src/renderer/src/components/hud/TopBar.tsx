import { Command } from "lucide-react";
import type React from "react";
import { commandRegistry } from "../../commands";
import { TimeControls } from "./TimeControls";

export const TopBar: React.FC = () => {
  const handleCommandPalette = () => {
    commandRegistry.dispatch("workbench.runCommand");
  };

  return (
    <div className="p-2 text-[var(--foreground)] flex items-center justify-between">
      {/* Time Controls */}
      <TimeControls />

      {/* Command Palette Button */}
      <button
        type="button"
        onClick={handleCommandPalette}
        className="pointer-events-auto flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--muted)] hover:bg-[var(--accent)] transition-colors text-sm text-[var(--foreground)]"
        title="Open command palette (Cmd+K)"
      >
        <Command size={14} />
        <span>K</span>
      </button>
    </div>
  );
};
