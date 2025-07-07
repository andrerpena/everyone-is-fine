import type { ConfigLoadResult, ConfigRecord } from "./types";

/**
 * Parse stored config content and return a ConfigLoadResult.
 * Handles both old format (plain config object) and new format (text + lastValidJson).
 */
export function parseStoredConfig(content: string | null): ConfigLoadResult {
  // No content - return empty defaults
  if (!content) {
    return { text: "{}", lastValidJson: {}, parseError: null };
  }

  // Try to parse the stored data
  let stored: unknown;
  try {
    stored = JSON.parse(content);
  } catch {
    // Content is invalid JSON - return empty defaults
    return { text: "{}", lastValidJson: {}, parseError: null };
  }

  // Check if it's the new format (has text and lastValidJson)
  if (
    typeof stored === "object" &&
    stored !== null &&
    "text" in stored &&
    "lastValidJson" in stored
  ) {
    const { text, lastValidJson } = stored as {
      text: string;
      lastValidJson: ConfigRecord;
    };

    // Check if text is valid JSON
    let parseError: string | null = null;
    try {
      JSON.parse(text);
    } catch (e) {
      parseError = String(e);
    }

    return { text, lastValidJson, parseError };
  }

  // Old format (just a plain config object) - migrate
  const text = JSON.stringify(stored, null, 2);
  return { text, lastValidJson: stored as ConfigRecord, parseError: null };
}
