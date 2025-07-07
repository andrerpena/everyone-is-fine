// =============================================================================
// SIMULATION LOOP
// =============================================================================
// Main game loop controller with tick-based simulation

import type { SimulationSpeed } from "./types";

// =============================================================================
// CONSTANTS
// =============================================================================

/** Target ticks per second */
export const TICKS_PER_SECOND = 60;

/** Milliseconds per tick at 1x speed */
export const MS_PER_TICK = 1000 / TICKS_PER_SECOND;

// =============================================================================
// SIMULATION LOOP CLASS
// =============================================================================

/**
 * Manages the game simulation loop.
 *
 * Features:
 * - Fixed timestep for deterministic simulation
 * - Adjustable speed (1x, 2x, 4x)
 * - Pause/resume functionality
 * - Callbacks for tick and render updates
 */
export class SimulationLoop {
  private isRunning = false;
  private speed: SimulationSpeed = 1;
  private currentTick = 0;
  private accumulator = 0;
  private lastTimestamp = 0;
  private animationFrameId: number | null = null;

  /** Called each simulation tick with delta time in seconds */
  private onTick: ((deltaTime: number, tick: number) => void) | null = null;

  /** Called each render frame with interpolation alpha (0-1) */
  private onRender: ((alpha: number) => void) | null = null;

  /** Called when play/pause state changes */
  private onPlayStateChange: ((isPlaying: boolean) => void) | null = null;

  /** Called when speed changes */
  private onSpeedChange: ((speed: SimulationSpeed) => void) | null = null;

  // ===========================================================================
  // CONTROL METHODS
  // ===========================================================================

  /** Start the simulation loop */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastTimestamp = performance.now();
    this.accumulator = 0;
    this.loop(this.lastTimestamp);
    this.onPlayStateChange?.(true);
  }

  /** Stop the simulation loop */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.onPlayStateChange?.(false);
  }

  /** Toggle play/pause */
  toggle(): void {
    if (this.isRunning) {
      this.stop();
    } else {
      this.start();
    }
  }

  /** Set simulation speed multiplier */
  setSpeed(speed: SimulationSpeed): void {
    if (speed !== this.speed) {
      this.speed = speed;
      this.onSpeedChange?.(speed);
    }
  }

  /** Get current speed */
  getSpeed(): SimulationSpeed {
    return this.speed;
  }

  /** Get current tick */
  getCurrentTick(): number {
    return this.currentTick;
  }

  /** Check if simulation is running */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /** Reset tick counter */
  reset(): void {
    this.currentTick = 0;
    this.accumulator = 0;
  }

  // ===========================================================================
  // CALLBACK SETTERS
  // ===========================================================================

  /** Set the tick callback */
  setTickCallback(callback: (deltaTime: number, tick: number) => void): void {
    this.onTick = callback;
  }

  /** Set the render callback */
  setRenderCallback(callback: (alpha: number) => void): void {
    this.onRender = callback;
  }

  /** Set the play state change callback */
  setPlayStateCallback(callback: (isPlaying: boolean) => void): void {
    this.onPlayStateChange = callback;
  }

  /** Set the speed change callback */
  setSpeedCallback(callback: (speed: SimulationSpeed) => void): void {
    this.onSpeedChange = callback;
  }

  // ===========================================================================
  // PRIVATE LOOP
  // ===========================================================================

  /**
   * Main loop using requestAnimationFrame.
   * Uses fixed timestep for deterministic simulation with
   * variable rendering.
   */
  private loop = (timestamp: number): void => {
    if (!this.isRunning) return;

    // Calculate delta time
    const deltaMs = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    // Clamp delta to prevent spiral of death
    const clampedDeltaMs = Math.min(deltaMs, 250);

    // Add to accumulator (adjusted for speed)
    this.accumulator += clampedDeltaMs * this.speed;

    // Process fixed timestep ticks
    const fixedDeltaTime = MS_PER_TICK / 1000; // In seconds

    while (this.accumulator >= MS_PER_TICK) {
      this.currentTick++;
      this.onTick?.(fixedDeltaTime, this.currentTick);
      this.accumulator -= MS_PER_TICK;
    }

    // Calculate interpolation alpha for smooth rendering
    const alpha = this.accumulator / MS_PER_TICK;
    this.onRender?.(alpha);

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.loop);
  };
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/** Global simulation loop instance */
export const simulationLoop = new SimulationLoop();
