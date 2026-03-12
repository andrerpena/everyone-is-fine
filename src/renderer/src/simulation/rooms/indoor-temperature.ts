// =============================================================================
// INDOOR TEMPERATURE
// =============================================================================
// Computes indoor temperature based on outdoor temperature and insulation.
// Roofed rooms moderate temperature toward a comfortable baseline.

// =============================================================================
// CONSTANTS
// =============================================================================

/** Comfortable baseline temperature that insulation tends toward (°C) */
export const INDOOR_COMFORT_BASELINE = 20;

/**
 * Default insulation factor (0 to 1).
 * 0 = no insulation (indoor temp equals outdoor temp)
 * 1 = perfect insulation (indoor temp equals comfort baseline)
 */
export const DEFAULT_INSULATION = 0.5;

// =============================================================================
// CALCULATION
// =============================================================================

/**
 * Compute indoor temperature from outdoor temperature.
 *
 * Uses linear interpolation between outdoor temp and comfort baseline,
 * weighted by insulation factor.
 *
 * Formula: indoor = outdoor + insulation * (baseline - outdoor)
 *
 * Examples (with default 0.5 insulation):
 * - Outdoor 30°C → Indoor 25°C (cooler inside)
 * - Outdoor -10°C → Indoor 5°C (warmer inside)
 * - Outdoor 20°C → Indoor 20°C (no change at baseline)
 *
 * @param outdoorTemp - Current outdoor temperature in °C
 * @param insulation - Insulation factor (0 to 1), default 0.5
 * @returns Indoor temperature in °C (rounded to 1 decimal)
 */
export function getIndoorTemperature(
  outdoorTemp: number,
  insulation = DEFAULT_INSULATION,
): number {
  const raw =
    outdoorTemp + insulation * (INDOOR_COMFORT_BASELINE - outdoorTemp);
  return Math.round(raw * 10) / 10;
}
