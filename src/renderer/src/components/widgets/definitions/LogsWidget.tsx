import { ScrollText, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type LogEntry,
  type LogLevel,
  useLogStore,
} from "../../../lib/log-store";
import type { WidgetComponentProps, WidgetDefinition } from "../types";

const LEVELS: LogLevel[] = ["debug", "info", "warn", "error"];

const LEVEL_CLASSES: Record<LogLevel, string> = {
  debug: "text-muted-foreground",
  info: "text-foreground",
  warn: "text-log-warn",
  error: "text-destructive",
};

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  const ms = String(d.getMilliseconds()).padStart(3, "0");
  return `${h}:${m}:${s}.${ms}`;
}

function LogsWidget(_props: WidgetComponentProps) {
  const entries = useLogStore((s) => s.entries);
  const allTags = useLogStore((s) => s.allTags);
  const clear = useLogStore((s) => s.clear);

  const [enabledLevels, setEnabledLevels] = useState<Set<LogLevel>>(
    () => new Set(LEVELS),
  );
  const [selectedTags, setSelectedTags] = useState<Set<string>>(
    () => new Set(),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);

  const listRef = useRef<HTMLDivElement>(null);

  const toggleLevel = useCallback((level: LogLevel) => {
    setEnabledLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  }, []);

  const filtered = entries.filter((entry) => {
    if (!enabledLevels.has(entry.level)) return false;
    if (selectedTags.size > 0 && !entry.tags.some((t) => selectedTags.has(t)))
      return false;
    if (
      searchQuery &&
      !entry.message.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  // Auto-scroll to bottom when new entries arrive
  const prevCountRef = useRef(entries.length);
  useEffect(() => {
    if (entries.length !== prevCountRef.current) {
      prevCountRef.current = entries.length;
      if (autoScroll && listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    }
  });

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 16;
    setAutoScroll(atBottom);
  }, []);

  const sortedTags = Array.from(allTags).sort();

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logs..."
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-border flex-wrap min-h-8">
        {/* Level toggles */}
        {LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => toggleLevel(level)}
            className={`px-1.5 py-0.5 text-xs font-mono rounded cursor-pointer ${
              enabledLevels.has(level)
                ? LEVEL_CLASSES[level]
                : "text-muted-foreground/30"
            }`}
          >
            {level.toUpperCase()}
          </button>
        ))}

        {/* Divider */}
        {sortedTags.length > 0 && <div className="w-px h-4 bg-border mx-1" />}

        {/* Tag chips */}
        {sortedTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className={`px-1.5 py-0.5 text-xs rounded cursor-pointer ${
              selectedTags.has(tag)
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {tag}
          </button>
        ))}

        <div className="flex-1" />

        {/* Clear button */}
        <button
          type="button"
          onClick={clear}
          className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
          title="Clear logs"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Log list */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden font-mono text-xs p-1"
      >
        {filtered.map((entry) => (
          <LogRow key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}

function LogRow({ entry }: { entry: LogEntry }) {
  return (
    <div className={`flex gap-2 px-1 leading-5 ${LEVEL_CLASSES[entry.level]}`}>
      <span className="text-muted-foreground shrink-0">
        {formatTime(entry.timestamp)}
      </span>
      <span className="shrink-0 w-12">{entry.level.toUpperCase()}</span>
      <span className="break-all">{entry.message}</span>
      {entry.tags.length > 0 && (
        <span className="text-muted-foreground shrink-0">
          [{entry.tags.join(", ")}]
        </span>
      )}
    </div>
  );
}

export const logsWidget: WidgetDefinition = {
  id: "logs",
  label: "Logs",
  icon: ScrollText,
  component: LogsWidget,
};
