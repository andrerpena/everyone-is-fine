// =============================================================================
// OUTDOOR TEMPERATURE SIMULATION
// =============================================================================
// Computes outdoor temperature based on season and time of day.

import type { Season } from "../../world/types";

// =============================================================================
// CONSTANTS
// =============================================================================

/** Base temperature (°C) for each season at midday */
const SEASON_BASE_TEMPS: Record<Season, number> = {
  spring: 15,
  summer: 25,
  autumn: 12,
  winter: -2,
};

/** Day/night temperature swing (half-amplitude in °C) */
const DIURNAL_AMPLITUDE = 5;

/** Hour of peak temperature (2 PM) */
const PEAK_HOUR = 14;

// =============================================================================
// TEMPERATURE CALCULATION
// =============================================================================

/**
 * Compute outdoor temperature based on season and hour of day.
 *
 * Uses a sinusoidal day/night variation centered on the season's base temp:
 * - Warmest at PEAK_HOUR (14:00)
 * - Coldest 12 hours later (02:00)
 * - Amplitude: ±DIURNAL_AMPLITUDE (±5°C)
 *
 * @param season - Current season
 * @param hour - Hour of day (0-23)
 * @returns Temperature in °C (rounded to 1 decimal)
 */
export function getOutdoorTemperature(season: Season, hour: number): number {
  const base = SEASON_BASE_TEMPS[season];

  // Sinusoidal variation: peak at PEAK_HOUR, trough 12 hours later
  const hoursFromPeak = hour - PEAK_HOUR;
  const variation =
    DIURNAL_AMPLITUDE * Math.cos((hoursFromPeak * Math.PI) / 12);

  return Math.round((base + variation) * 10) / 10;
}
