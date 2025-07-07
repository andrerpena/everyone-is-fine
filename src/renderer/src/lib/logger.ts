import { type LogLevel, useLogStore } from "./log-store";

function log(level: LogLevel, message: string, tags?: string[]): void {
  useLogStore.getState().addEntry(level, message, tags);
}

export const logger = {
  debug: (message: string, tags?: string[]) => log("debug", message, tags),
  info: (message: string, tags?: string[]) => log("info", message, tags),
  warn: (message: string, tags?: string[]) => log("warn", message, tags),
  error: (message: string, tags?: string[]) => log("error", message, tags),
};
