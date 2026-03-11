// =============================================================================
// WEATHER PARTICLE RENDERER
// =============================================================================
// Renders falling rain/snow particles based on the current weather type.
// Uses a recycled particle pool drawn as Graphics each frame.

import type { WeatherType } from "@renderer/world/types";
import { Graphics } from "pixi.js";

// =============================================================================
// TYPES
// =============================================================================

interface Particle {
  x: number;
  y: number;
  speed: number;
  /** Horizontal drift (snow sway) */
  drift: number;
  /** Particle length for rain lines */
  length: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const RAIN_PARTICLE_COUNT = 400;
const STORM_PARTICLE_COUNT = 800;
const SNOW_PARTICLE_COUNT = 200;

const RAIN_COLOR = 0xaaccff;
const RAIN_ALPHA = 0.4;
const SNOW_COLOR = 0xffffff;
const SNOW_ALPHA = 0.6;

// =============================================================================
// WEATHER RENDERER
// =============================================================================

export class WeatherRenderer {
  private graphics: Graphics;
  private particles: Particle[] = [];
  private currentType: WeatherType = "clear";
  private worldWidth: number;
  private worldHeight: number;

  constructor(worldWidth: number, worldHeight: number) {
    this.graphics = new Graphics();
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
  }

  /** Get the underlying Graphics display object to add to the viewport */
  getDisplayObject(): Graphics {
    return this.graphics;
  }

  /** Set the active weather type. Resets particles when type changes. */
  setWeatherType(type: WeatherType): void {
    if (type === this.currentType) return;
    this.currentType = type;
    this.initParticles();
  }

  /** Called each frame to animate particles */
  update(delta: number): void {
    if (this.particles.length === 0) {
      this.graphics.visible = false;
      return;
    }

    this.graphics.visible = true;
    this.graphics.clear();

    const isSnow = this.currentType === "snow";
    const dt = Math.min(delta, 3); // Cap delta to avoid huge jumps

    for (const p of this.particles) {
      // Move particle
      p.y += p.speed * dt;
      p.x += p.drift * dt;

      // Wrap around when off-screen
      if (p.y > this.worldHeight) {
        p.y = -p.length;
        p.x = Math.random() * this.worldWidth;
      }
      if (p.x > this.worldWidth) p.x = 0;
      if (p.x < 0) p.x = this.worldWidth;

      if (isSnow) {
        // Snow: small circles
        this.graphics.circle(p.x, p.y, 1.5);
        this.graphics.fill({ color: SNOW_COLOR, alpha: SNOW_ALPHA });
      } else {
        // Rain/storm: angled lines
        this.graphics
          .moveTo(p.x, p.y)
          .lineTo(p.x - p.drift * 0.3, p.y + p.length);
        this.graphics.stroke({
          color: RAIN_COLOR,
          alpha: RAIN_ALPHA,
          width: 1,
        });
      }
    }
  }

  /** Initialize particle pool based on current weather type */
  private initParticles(): void {
    this.particles = [];

    let count = 0;

    switch (this.currentType) {
      case "rain":
        count = RAIN_PARTICLE_COUNT;
        break;
      case "storm":
        count = STORM_PARTICLE_COUNT;
        break;
      case "snow":
        count = SNOW_PARTICLE_COUNT;
        break;
      default:
        // clear, cloudy, fog, heatwave: no particles
        this.graphics.clear();
        this.graphics.visible = false;
        return;
    }

    const isSnow = this.currentType === "snow";

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.worldWidth,
        y: Math.random() * this.worldHeight,
        speed: isSnow
          ? 0.5 + Math.random() * 1 // Snow: slow
          : 3 + Math.random() * 4, // Rain: fast
        drift: isSnow
          ? (Math.random() - 0.5) * 0.5 // Snow: gentle sway
          : -1 - Math.random() * 1, // Rain: slight left angle
        length: isSnow ? 2 : 6 + Math.random() * 8, // Rain: varying line lengths
      });
    }

    // Storm particles are faster
    if (this.currentType === "storm") {
      for (const p of this.particles) {
        p.speed *= 1.5;
        p.drift *= 1.5;
        p.length *= 1.2;
      }
    }
  }

  destroy(): void {
    this.graphics.destroy();
    this.particles = [];
  }
}
