// =============================================================================
// WEATHER SYSTEM
// =============================================================================
// Tick-based simulation that transitions between weather types based on season.
// Updates weather type, intensity, wind speed/direction on the WeatherState.

import type { Season, WeatherState, WeatherType } from "../../world/types";

// =============================================================================
// CONSTANTS
// =============================================================================

/** How often (in ticks) the system evaluates a weather transition */
const CHECK_INTERVAL = 600; // ~10 seconds at 60 TPS

/** Minimum ticks a weather type persists before it can change */
const MIN_DURATION = 1800; // ~30 seconds at 60 TPS

/** Chance (0-1) of transitioning to a new weather type each check */
const TRANSITION_CHANCE = 0.15;

// =============================================================================
// SEASON WEATHER PROBABILITIES
// =============================================================================

/** Weighted probability table per season. Values must sum to 1. */
const SEASON_WEATHER_WEIGHTS: Record<Season, Record<WeatherType, number>> = {
  spring: {
    clear: 0.35,
    cloudy: 0.25,
    rain: 0.25,
    storm: 0.05,
    snow: 0.0,
    fog: 0.1,
    heatwave: 0.0,
  },
  summer: {
    clear: 0.5,
    cloudy: 0.15,
    rain: 0.1,
    storm: 0.1,
    snow: 0.0,
    fog: 0.05,
    heatwave: 0.1,
  },
  autumn: {
    clear: 0.25,
    cloudy: 0.3,
    rain: 0.2,
    storm: 0.05,
    snow: 0.05,
    fog: 0.15,
    heatwave: 0.0,
  },
  winter: {
    clear: 0.2,
    cloudy: 0.2,
    rain: 0.1,
    storm: 0.1,
    snow: 0.25,
    fog: 0.15,
    heatwave: 0.0,
  },
};

// =============================================================================
// TEMPERATURE MODIFIERS
// =============================================================================

/** Temperature offset applied based on current weather type */
export const WEATHER_TEMP_MODIFIERS: Record<WeatherType, number> = {
  clear: 0,
  cloudy: -1,
  rain: -2,
  storm: -4,
  snow: -3,
  fog: -1,
  heatwave: 5,
};

// =============================================================================
// WEATHER LABELS
// =============================================================================

export const WEATHER_LABELS: Record<WeatherType, string> = {
  clear: "Clear",
  cloudy: "Cloudy",
  rain: "Rain",
  storm: "Storm",
  snow: "Snow",
  fog: "Fog",
  heatwave: "Heatwave",
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Pick a weather type from the season's probability table using a random roll.
 */
export function pickWeatherType(season: Season, roll: number): WeatherType {
  const weights = SEASON_WEATHER_WEIGHTS[season];
  let cumulative = 0;
  for (const [type, weight] of Object.entries(weights)) {
    cumulative += weight;
    if (roll <= cumulative) {
      return type as WeatherType;
    }
  }
  // Fallback (should not reach due to weights summing to 1)
  return "clear";
}

// =============================================================================
// WEATHER SYSTEM CLASS
// =============================================================================

export class WeatherSystem {
  private ticksSinceLastCheck = 0;
  private ticksSinceLastTransition = 0;

  /**
   * Called every tick. Periodically evaluates weather transitions.
   * Mutates the provided WeatherState in place.
   */
  update(weather: WeatherState, season: Season): void {
    this.ticksSinceLastCheck++;
    this.ticksSinceLastTransition++;

    if (this.ticksSinceLastCheck < CHECK_INTERVAL) return;
    this.ticksSinceLastCheck = 0;

    // Don't transition if minimum duration hasn't elapsed
    if (this.ticksSinceLastTransition < MIN_DURATION) return;

    // Roll for transition
    if (Math.random() >= TRANSITION_CHANCE) return;

    const newType = pickWeatherType(season, Math.random());

    // Avoid no-op transitions to the same type
    if (newType === weather.type) return;

    weather.type = newType;
    weather.intensity = 0.3 + Math.random() * 0.7; // 0.3 - 1.0
    weather.windSpeed = Math.round(Math.random() * 20);
    weather.windDirection = Math.round(Math.random() * 360);
    // Pre-roll the next weather type as a forecast
    weather.forecast = pickWeatherType(season, Math.random());
    this.ticksSinceLastTransition = 0;
  }
}
