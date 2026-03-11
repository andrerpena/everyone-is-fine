import { describe, expect, it } from "vitest";
import type { WorldTime } from "../../world/types";
import {
  advanceTime,
  DAYS_PER_SEASON,
  formatGameTime,
  getDayPeriod,
} from "./time-system";

function makeTime(overrides: Partial<WorldTime> = {}): WorldTime {
  return {
    tickCount: 0,
    day: 1,
    hour: 8,
    minute: 0,
    season: "spring",
    year: 1,
    ...overrides,
  };
}

/** Advance time by N ticks */
function advanceN(time: WorldTime, n: number): WorldTime {
  let t = time;
  for (let i = 0; i < n; i++) {
    t = advanceTime(t);
  }
  return t;
}

describe("advanceTime", () => {
  it("increments tickCount each tick", () => {
    const t0 = makeTime();
    const t1 = advanceTime(t0);
    expect(t1.tickCount).toBe(1);
    const t2 = advanceTime(t1);
    expect(t2.tickCount).toBe(2);
  });

  it("does not change minute before 60 ticks", () => {
    const t = advanceN(makeTime(), 59);
    expect(t.tickCount).toBe(59);
    expect(t.minute).toBe(0);
    expect(t.hour).toBe(8);
  });

  it("rolls minute at 60 ticks", () => {
    const t = advanceN(makeTime(), 60);
    expect(t.tickCount).toBe(60);
    expect(t.minute).toBe(1);
    expect(t.hour).toBe(8);
  });

  it("rolls hour at 60 minutes", () => {
    // 60 ticks/min * 60 min = 3600 ticks for 1 hour
    const t = advanceN(makeTime(), 3600);
    expect(t.minute).toBe(0);
    expect(t.hour).toBe(9);
  });

  it("rolls day at 24 hours", () => {
    // Start at hour 23, minute 59 — next minute rollover should advance day
    const t0 = makeTime({ hour: 23, minute: 59, tickCount: 59 });
    // Advance 1 tick to reach tick 60, triggering minute rollover
    const t1 = advanceTime(t0);
    expect(t1.hour).toBe(0);
    expect(t1.minute).toBe(0);
    expect(t1.day).toBe(2);
  });

  it("rolls season after DAYS_PER_SEASON days", () => {
    const t0 = makeTime({
      day: DAYS_PER_SEASON,
      hour: 23,
      minute: 59,
      tickCount: 59,
    });
    const t1 = advanceTime(t0);
    expect(t1.day).toBe(1);
    expect(t1.season).toBe("summer");
  });

  it("cycles through all seasons", () => {
    // Use tickCount values that are 1 below a 60-tick boundary so the next tick crosses it
    let t = makeTime({
      day: DAYS_PER_SEASON,
      hour: 23,
      minute: 59,
      tickCount: 59,
    });

    t = advanceTime(t); // spring → summer
    expect(t.season).toBe("summer");

    // Set up for next season transition: tickCount must be N*60 - 1
    t = { ...t, day: DAYS_PER_SEASON, hour: 23, minute: 59, tickCount: 119 };
    t = advanceTime(t); // summer → autumn
    expect(t.season).toBe("autumn");

    t = { ...t, day: DAYS_PER_SEASON, hour: 23, minute: 59, tickCount: 179 };
    t = advanceTime(t); // autumn → winter
    expect(t.season).toBe("winter");

    t = { ...t, day: DAYS_PER_SEASON, hour: 23, minute: 59, tickCount: 239 };
    t = advanceTime(t); // winter → spring (new year)
    expect(t.season).toBe("spring");
    expect(t.year).toBe(2);
  });

  it("increments year when winter ends", () => {
    const t0 = makeTime({
      season: "winter",
      day: DAYS_PER_SEASON,
      hour: 23,
      minute: 59,
      tickCount: 59,
    });
    const t1 = advanceTime(t0);
    expect(t1.season).toBe("spring");
    expect(t1.year).toBe(2);
  });

  it("returns new object (immutable)", () => {
    const t0 = makeTime();
    const t1 = advanceTime(t0);
    expect(t1).not.toBe(t0);
    expect(t0.tickCount).toBe(0); // Original unchanged
  });
});

describe("formatGameTime", () => {
  it("formats default start time", () => {
    expect(formatGameTime(makeTime())).toBe("Day 1, 08:00, Spring Year 1");
  });

  it("pads single-digit hours and minutes", () => {
    expect(formatGameTime(makeTime({ hour: 3, minute: 5 }))).toBe(
      "Day 1, 03:05, Spring Year 1",
    );
  });

  it("formats with different season and year", () => {
    expect(
      formatGameTime(
        makeTime({ day: 10, hour: 17, minute: 30, season: "winter", year: 3 }),
      ),
    ).toBe("Day 10, 17:30, Winter Year 3");
  });
});

describe("getDayPeriod", () => {
  it("returns night for late hours", () => {
    expect(getDayPeriod(23)).toBe("night");
    expect(getDayPeriod(0)).toBe("night");
    expect(getDayPeriod(4)).toBe("night");
  });

  it("returns dawn for early morning", () => {
    expect(getDayPeriod(5)).toBe("dawn");
    expect(getDayPeriod(6)).toBe("dawn");
  });

  it("returns morning for mid-morning", () => {
    expect(getDayPeriod(7)).toBe("morning");
    expect(getDayPeriod(11)).toBe("morning");
  });

  it("returns afternoon for midday", () => {
    expect(getDayPeriod(12)).toBe("afternoon");
    expect(getDayPeriod(16)).toBe("afternoon");
  });

  it("returns evening", () => {
    expect(getDayPeriod(17)).toBe("evening");
    expect(getDayPeriod(19)).toBe("evening");
  });

  it("returns dusk", () => {
    expect(getDayPeriod(20)).toBe("dusk");
    expect(getDayPeriod(21)).toBe("dusk");
  });
});
