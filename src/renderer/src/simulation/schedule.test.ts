import { describe, expect, it } from "vitest";
import {
  createDefaultSchedule,
  getScheduledActivity,
  isValidScheduleActivity,
} from "./schedule";

describe("schedule", () => {
  describe("createDefaultSchedule", () => {
    it("returns a 24-element array", () => {
      const schedule = createDefaultSchedule();
      expect(schedule).toHaveLength(24);
    });

    it("has sleep hours from 0-4 and 21-23", () => {
      const schedule = createDefaultSchedule();
      for (const hour of [0, 1, 2, 3, 4, 21, 22, 23]) {
        expect(schedule[hour]).toBe("sleep");
      }
    });

    it("has work hours from 6-17", () => {
      const schedule = createDefaultSchedule();
      for (let hour = 6; hour <= 17; hour++) {
        expect(schedule[hour]).toBe("work");
      }
    });

    it("has recreation hours from 18-20", () => {
      const schedule = createDefaultSchedule();
      for (let hour = 18; hour <= 20; hour++) {
        expect(schedule[hour]).toBe("recreation");
      }
    });

    it("has anything at hour 5 (transition)", () => {
      const schedule = createDefaultSchedule();
      expect(schedule[5]).toBe("anything");
    });
  });

  describe("getScheduledActivity", () => {
    it("returns the activity for the given hour", () => {
      const schedule = createDefaultSchedule();
      expect(getScheduledActivity(schedule, 0)).toBe("sleep");
      expect(getScheduledActivity(schedule, 6)).toBe("work");
      expect(getScheduledActivity(schedule, 18)).toBe("recreation");
      expect(getScheduledActivity(schedule, 5)).toBe("anything");
    });

    it("clamps negative hours to 0", () => {
      const schedule = createDefaultSchedule();
      expect(getScheduledActivity(schedule, -1)).toBe("sleep");
    });

    it("clamps hours above 23 to 23", () => {
      const schedule = createDefaultSchedule();
      expect(getScheduledActivity(schedule, 25)).toBe("sleep");
    });

    it("floors fractional hours", () => {
      const schedule = createDefaultSchedule();
      expect(getScheduledActivity(schedule, 6.7)).toBe("work");
    });
  });

  describe("isValidScheduleActivity", () => {
    it("accepts valid activities", () => {
      expect(isValidScheduleActivity("work")).toBe(true);
      expect(isValidScheduleActivity("sleep")).toBe(true);
      expect(isValidScheduleActivity("recreation")).toBe(true);
      expect(isValidScheduleActivity("anything")).toBe(true);
    });

    it("rejects invalid activities", () => {
      expect(isValidScheduleActivity("fight")).toBe(false);
      expect(isValidScheduleActivity("")).toBe(false);
      expect(isValidScheduleActivity("WORK")).toBe(false);
    });
  });
});
