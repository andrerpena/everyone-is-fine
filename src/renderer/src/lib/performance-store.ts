import { create } from "zustand";

// =============================================================================
// TYPES
// =============================================================================

export interface FpsDataPoint {
  /** Index for X-axis (0 = oldest, increasing = newer) */
  index: number;
  /** FPS value (null = no data yet) */
  fps: number | null;
}

interface PerformanceState {
  /** Current FPS (for status bar display) */
  fps: number;
  /** FPS history for charts (derived from circular buffer) */
  fpsHistory: FpsDataPoint[];
}

interface PerformanceActions {
  /** Push a new FPS value to the history buffer */
  pushFps: (fps: number) => void;
}

type PerformanceStore = PerformanceState & PerformanceActions;

// =============================================================================
// CIRCULAR BUFFER
// =============================================================================

/** Number of data points to keep (1 minute at 2 updates/second) */
const HISTORY_SIZE = 120;

/** Internal circular buffer state (not exposed to React) */
const buffer: (number | null)[] = new Array(HISTORY_SIZE).fill(null);
let writeIndex = 0;

/**
 * Get ordered array from circular buffer.
 * Always returns HISTORY_SIZE data points for consistent chart width.
 * Null values indicate no data yet (recharts won't draw those segments).
 */
function getOrderedHistory(): FpsDataPoint[] {
  const result: FpsDataPoint[] = [];
  for (let i = 0; i < HISTORY_SIZE; i++) {
    const bufferIndex = (writeIndex + i) % HISTORY_SIZE;
    result.push({ index: i, fps: buffer[bufferIndex] });
  }
  return result;
}

/**
 * Push a new value to the circular buffer.
 * Returns the new ordered history array.
 */
function pushToBuffer(fps: number): FpsDataPoint[] {
  buffer[writeIndex] = fps;
  writeIndex = (writeIndex + 1) % HISTORY_SIZE;
  return getOrderedHistory();
}

// =============================================================================
// STORE
// =============================================================================

/**
 * Store for performance metrics like FPS.
 * Uses a circular buffer for O(1) insertions.
 * Values are updated in a throttled manner (every 500ms) to avoid overhead.
 */
export const usePerformanceStore = create<PerformanceStore>((set) => ({
  fps: 0,
  fpsHistory: [],

  pushFps: (fps) => {
    const fpsHistory = pushToBuffer(fps);
    set({ fps, fpsHistory });
  },
}));
