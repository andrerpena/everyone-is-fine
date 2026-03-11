// =============================================================================
// TIME SYSTEM
// =============================================================================
// Advances the in-game clock each simulation tick.
// 1 tick = 1 in-game second. At 60 TPS, 1 real second = 1 in-game minute.

import type { Season, WorldTime } from "../../world/types";

// =============================================================================
// CONSTANTS
// =============================================================================

/** In-game seconds per minute */
const SECONDS_PER_MINUTE = 60;

/** Minutes per hour */
const MINUTES_PER_HOUR = 60;

/** Hours per day */
const HOURS_PER_DAY = 24;

/** Days per season */
export const DAYS_PER_SEASON = 15;

/** Seasons in order */
const SEASONS: readonly Season[] = [
  "spring",
  "summer",
  "autumn",
  "winter",
] as const;

/** Total seasons per year */
const SEASONS_PER_YEAR = SEASONS.length;

/** Ticks (in-game seconds) per in-game minute */
const TICKS_PER_MINUTE = SECONDS_PER_MINUTE;

// =============================================================================
// TIME ADVANCEMENT
// =============================================================================

/**
 * Advance the world time by one tick (1 in-game second).
 * Returns a new WorldTime object with updated values.
 * Handles all rollovers: second → minute → hour → day → season → year.
 */
export function advanceTime(time: WorldTime): WorldTime {
  const tickCount = time.tickCount + 1;

  // Compute total minutes from tick count
  // We only roll over minutes when we cross a minute boundary
  const prevMinuteTick = Math.floor(time.tickCount / TICKS_PER_MINUTE);
  const currMinuteTick = Math.floor(tickCount / TICKS_PER_MINUTE);

  // No minute rollover — just increment tick count
  if (currMinuteTick === prevMinuteTick) {
    return { ...time, tickCount };
  }

  // Minute rolled over — cascade through hour, day, season, year
  let minute = time.minute + 1;
  let hour = time.hour;
  let day = time.day;
  let season = time.season;
  let year = time.year;

  if (minute >= MINUTES_PER_HOUR) {
    minute = 0;
    hour += 1;
  }

  if (hour >= HOURS_PER_DAY) {
    hour = 0;
    day += 1;
  }

  if (day > DAYS_PER_SEASON) {
    day = 1;
    const seasonIndex = SEASONS.indexOf(season);
    const nextSeasonIndex = seasonIndex + 1;

    if (nextSeasonIndex >= SEASONS_PER_YEAR) {
      season = SEASONS[0];
      year += 1;
    } else {
      season = SEASONS[nextSeasonIndex];
    }
  }

  return { tickCount, day, hour, minute, season, year };
}

// =============================================================================
// FORMATTING
// =============================================================================

/**
 * Format a WorldTime as a human-readable string.
 * Example: "Day 3, 14:30, Spring Year 1"
 */
export function formatGameTime(time: WorldTime): string {
  const hourStr = String(time.hour).padStart(2, "0");
  const minuteStr = String(time.minute).padStart(2, "0");
  const seasonLabel =
    time.season.charAt(0).toUpperCase() + time.season.slice(1);
  return `Day ${time.day}, ${hourStr}:${minuteStr}, ${seasonLabel} Year ${time.year}`;
}

/**
 * Get the current period of day based on hour.
 */
export function getDayPeriod(
  hour: number,
): "night" | "dawn" | "morning" | "afternoon" | "evening" | "dusk" {
  if (hour >= 22 || hour < 5) return "night";
  if (hour >= 5 && hour < 7) return "dawn";
  if (hour >= 7 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 20) return "evening";
  return "dusk"; // 20-22
}
