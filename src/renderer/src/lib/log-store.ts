import { create } from "zustand";

// =============================================================================
// TYPES
// =============================================================================

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  id: number;
  timestamp: number;
  level: LogLevel;
  message: string;
  tags: string[];
}

interface LogState {
  entries: LogEntry[];
  allTags: Set<string>;
}

interface LogActions {
  addEntry: (level: LogLevel, message: string, tags?: string[]) => void;
  clear: () => void;
}

type LogStore = LogState & LogActions;

// =============================================================================
// CONSTANTS
// =============================================================================

const MAX_ENTRIES = 1000;

// =============================================================================
// STORE
// =============================================================================

let nextId = 0;

export const useLogStore = create<LogStore>((set) => ({
  entries: [],
  allTags: new Set<string>(),

  addEntry: (level, message, tags = []) => {
    const entry: LogEntry = {
      id: nextId++,
      timestamp: Date.now(),
      level,
      message,
      tags,
    };

    set((state) => {
      const entries =
        state.entries.length >= MAX_ENTRIES
          ? [
              ...state.entries.slice(state.entries.length - MAX_ENTRIES + 1),
              entry,
            ]
          : [...state.entries, entry];

      const allTags = new Set(state.allTags);
      for (const tag of tags) {
        allTags.add(tag);
      }

      return { entries, allTags };
    });
  },

  clear: () => {
    set({ entries: [], allTags: new Set<string>() });
  },
}));
