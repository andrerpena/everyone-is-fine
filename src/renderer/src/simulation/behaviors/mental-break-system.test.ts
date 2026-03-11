// =============================================================================
// MENTAL BREAK SYSTEM TESTS
// =============================================================================

import { describe, expect, it } from "vitest";
import {
  MENTAL_BREAK_RECOVERY_THRESHOLD,
  MENTAL_BREAK_TRIGGER_THRESHOLD,
} from "./mental-break-system";

// =============================================================================
// THRESHOLD TESTS
// =============================================================================

describe("Mental break thresholds", () => {
  it("trigger threshold is less than recovery threshold (hysteresis)", () => {
    expect(MENTAL_BREAK_TRIGGER_THRESHOLD).toBeLessThan(
      MENTAL_BREAK_RECOVERY_THRESHOLD,
    );
  });

  it("trigger threshold is 0.2", () => {
    expect(MENTAL_BREAK_TRIGGER_THRESHOLD).toBe(0.2);
  });

  it("recovery threshold is 0.3", () => {
    expect(MENTAL_BREAK_RECOVERY_THRESHOLD).toBe(0.3);
  });

  it("both thresholds are in valid mood range [0, 1]", () => {
    expect(MENTAL_BREAK_TRIGGER_THRESHOLD).toBeGreaterThanOrEqual(0);
    expect(MENTAL_BREAK_TRIGGER_THRESHOLD).toBeLessThanOrEqual(1);
    expect(MENTAL_BREAK_RECOVERY_THRESHOLD).toBeGreaterThanOrEqual(0);
    expect(MENTAL_BREAK_RECOVERY_THRESHOLD).toBeLessThanOrEqual(1);
  });
});
