import { describe, expect, it, vi } from "vitest";
import type { WeatherState } from "../../world/types";
import {
  pickWeatherType,
  WEATHER_TEMP_MODIFIERS,
  WeatherSystem,
} from "./weather-system";

function makeWeather(type = "clear" as const): WeatherState {
  return {
    type,
    intensity: 0,
    temperature: 20,
    windSpeed: 5,
    windDirection: 0,
  };
}

describe("pickWeatherType", () => {
  it("returns clear for low roll in summer", () => {
    // Summer: clear = 0.5
    expect(pickWeatherType("summer", 0.1)).toBe("clear");
  });

  it("returns heatwave for high roll in summer", () => {
    // Summer: clear(0.5) + cloudy(0.15) + rain(0.1) + storm(0.1) + snow(0) + fog(0.05) + heatwave(0.1) = 1.0
    expect(pickWeatherType("summer", 0.95)).toBe("heatwave");
  });

  it("returns snow for appropriate roll in winter", () => {
    // Winter: clear(0.2) + cloudy(0.2) + rain(0.1) + storm(0.1) + snow(0.25) = 0.85
    // Roll of 0.65 → cumulative passes 0.6 at snow start (0.6), snow ends at 0.85
    expect(pickWeatherType("winter", 0.65)).toBe("snow");
  });

  it("never returns snow in summer", () => {
    // Snow weight is 0 in summer, so any roll should skip it
    for (let r = 0; r <= 1; r += 0.01) {
      expect(pickWeatherType("summer", r)).not.toBe("snow");
    }
  });

  it("never returns heatwave in winter", () => {
    for (let r = 0; r <= 1; r += 0.01) {
      expect(pickWeatherType("winter", r)).not.toBe("heatwave");
    }
  });
});

describe("WeatherSystem", () => {
  it("does not transition before CHECK_INTERVAL ticks", () => {
    const system = new WeatherSystem();
    const weather = makeWeather();

    for (let i = 0; i < 599; i++) {
      system.update(weather, "summer");
    }
    expect(weather.type).toBe("clear");
  });

  it("does not transition before MIN_DURATION even after CHECK_INTERVAL", () => {
    const system = new WeatherSystem();
    const weather = makeWeather();

    // Force Math.random to always return values that would trigger transition
    vi.spyOn(Math, "random").mockReturnValue(0.01);

    // Run 600 ticks (1 check interval) — but min duration is 1800
    for (let i = 0; i < 600; i++) {
      system.update(weather, "summer");
    }
    expect(weather.type).toBe("clear");

    vi.restoreAllMocks();
  });

  it("transitions after MIN_DURATION when roll succeeds", () => {
    const system = new WeatherSystem();
    const weather = makeWeather();

    // Run past min duration without triggering (high random = no transition)
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    for (let i = 0; i < 1800; i++) {
      system.update(weather, "summer");
    }
    expect(weather.type).toBe("clear");

    // Now make random succeed: first call = transition chance (0.01 < 0.15), second = weather pick
    let callCount = 0;
    vi.spyOn(Math, "random").mockImplementation(() => {
      callCount++;
      if (callCount === 1) return 0.01; // Pass transition chance
      if (callCount === 2) return 0.6; // Pick a non-clear weather
      return 0.5; // intensity/wind
    });

    // Tick to next check interval
    for (let i = 0; i < 600; i++) {
      system.update(weather, "summer");
    }
    expect(weather.type).not.toBe("clear");

    vi.restoreAllMocks();
  });

  it("updates intensity and wind on transition", () => {
    const system = new WeatherSystem();
    const weather = makeWeather();

    // Fast forward past min duration
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    for (let i = 0; i < 1800; i++) {
      system.update(weather, "winter");
    }

    // Trigger transition
    let callCount = 0;
    vi.spyOn(Math, "random").mockImplementation(() => {
      callCount++;
      if (callCount === 1) return 0.01; // transition chance pass
      if (callCount === 2) return 0.75; // pick snow in winter
      if (callCount === 3) return 0.5; // intensity: 0.3 + 0.5*0.7 = 0.65
      if (callCount === 4) return 0.5; // windSpeed: 10
      return 0.5; // windDirection: 180
    });

    for (let i = 0; i < 600; i++) {
      system.update(weather, "winter");
    }

    expect(weather.type).toBe("snow");
    expect(weather.intensity).toBeGreaterThan(0);
    expect(weather.windSpeed).toBeGreaterThanOrEqual(0);

    vi.restoreAllMocks();
  });
});

describe("WEATHER_TEMP_MODIFIERS", () => {
  it("clear has no modifier", () => {
    expect(WEATHER_TEMP_MODIFIERS.clear).toBe(0);
  });

  it("heatwave adds temperature", () => {
    expect(WEATHER_TEMP_MODIFIERS.heatwave).toBeGreaterThan(0);
  });

  it("storm reduces temperature", () => {
    expect(WEATHER_TEMP_MODIFIERS.storm).toBeLessThan(0);
  });
});
