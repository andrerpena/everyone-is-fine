import { describe, expect, it } from "vitest";
import { createDefaultSkills } from "./skills";
import type { Character } from "./types";
import { createCharacter } from "./types";
import {
  createDefaultWorkPriorities,
  getEligibleCharacters,
  pickBestCharacter,
  type WorkPriorities,
} from "./work-priorities";

function makeChar(overrides: Partial<Character> & { name: string }): Character {
  return createCharacter({
    position: { x: 0, y: 0, z: 0 },
    ...overrides,
  });
}

function skillsWithLevel(
  skillId: string,
  level: number,
): ReturnType<typeof createDefaultSkills> {
  const skills = createDefaultSkills();
  if (skillId in skills) {
    skills[skillId as keyof typeof skills].level = level;
  }
  return skills;
}

describe("work-priorities", () => {
  describe("createDefaultWorkPriorities", () => {
    it("sets all work types to priority 3", () => {
      const priorities = createDefaultWorkPriorities();
      expect(priorities.hauling).toBe(3);
      expect(priorities.construction).toBe(3);
      expect(priorities.growing).toBe(3);
      expect(priorities.cooking).toBe(3);
      expect(priorities.mining).toBe(3);
    });
  });

  describe("getEligibleCharacters", () => {
    it("excludes characters with priority 0 (disabled)", () => {
      const priorities: WorkPriorities = {
        ...createDefaultWorkPriorities(),
        hauling: 0,
      };
      const char = makeChar({ name: "Alice", workPriorities: priorities });

      const eligible = getEligibleCharacters(
        [char],
        "hauling",
        { x: 5, y: 5, z: 0 },
        () => false,
      );

      expect(eligible).toHaveLength(0);
    });

    it("excludes characters with active jobs", () => {
      const char = makeChar({ name: "Bob" });

      const eligible = getEligibleCharacters(
        [char],
        "hauling",
        { x: 5, y: 5, z: 0 },
        () => true, // all have active jobs
      );

      expect(eligible).toHaveLength(0);
    });

    it("excludes drafted characters", () => {
      const char = makeChar({ name: "Carl" });
      char.control.mode = "drafted";

      const eligible = getEligibleCharacters(
        [char],
        "hauling",
        { x: 5, y: 5, z: 0 },
        () => false,
      );

      expect(eligible).toHaveLength(0);
    });

    it("excludes characters in mental breaks", () => {
      const char = makeChar({ name: "Dana" });
      char.mentalBreak = { type: "daze", startedAtTick: 0 };

      const eligible = getEligibleCharacters(
        [char],
        "hauling",
        { x: 5, y: 5, z: 0 },
        () => false,
      );

      expect(eligible).toHaveLength(0);
    });

    it("sorts by priority first, then distance", () => {
      const alice = makeChar({
        name: "Alice",
        position: { x: 10, y: 10, z: 0 },
        workPriorities: { ...createDefaultWorkPriorities(), hauling: 2 },
      });
      const bob = makeChar({
        name: "Bob",
        position: { x: 1, y: 1, z: 0 },
        workPriorities: { ...createDefaultWorkPriorities(), hauling: 3 },
      });
      const carl = makeChar({
        name: "Carl",
        position: { x: 5, y: 5, z: 0 },
        workPriorities: { ...createDefaultWorkPriorities(), hauling: 2 },
      });

      const eligible = getEligibleCharacters(
        [alice, bob, carl],
        "hauling",
        { x: 0, y: 0, z: 0 },
        () => false,
      );

      // Alice (priority 2, dist 20) and Carl (priority 2, dist 10) before Bob (priority 3, dist 2)
      // Among priority 2: Carl (dist 10) before Alice (dist 20)
      expect(eligible[0].id).toBe(carl.id);
      expect(eligible[1].id).toBe(alice.id);
      expect(eligible[2].id).toBe(bob.id);
    });
  });

  describe("pickBestCharacter", () => {
    it("returns null when no eligible characters", () => {
      const result = pickBestCharacter(
        [],
        "hauling",
        { x: 0, y: 0, z: 0 },
        () => false,
      );
      expect(result).toBeNull();
    });

    it("picks the highest priority (lowest number) character", () => {
      const alice = makeChar({
        name: "Alice",
        position: { x: 0, y: 0, z: 0 },
        workPriorities: { ...createDefaultWorkPriorities(), cooking: 1 },
      });
      const bob = makeChar({
        name: "Bob",
        position: { x: 0, y: 0, z: 0 },
        workPriorities: { ...createDefaultWorkPriorities(), cooking: 4 },
      });

      const result = pickBestCharacter(
        [bob, alice],
        "cooking",
        { x: 0, y: 0, z: 0 },
        () => false,
      );
      expect(result).toBe(alice.id);
    });

    it("picks closest when priorities and skills are equal", () => {
      const alice = makeChar({
        name: "Alice",
        position: { x: 10, y: 0, z: 0 },
      });
      const bob = makeChar({
        name: "Bob",
        position: { x: 2, y: 0, z: 0 },
      });

      const result = pickBestCharacter(
        [alice, bob],
        "hauling",
        { x: 0, y: 0, z: 0 },
        () => false,
      );
      expect(result).toBe(bob.id);
    });

    it("prefers higher-skilled colonist when priorities are equal", () => {
      const alice = makeChar({
        name: "Alice",
        position: { x: 0, y: 0, z: 0 },
        skills: skillsWithLevel("cooking", 8),
      });
      const bob = makeChar({
        name: "Bob",
        position: { x: 0, y: 0, z: 0 },
        skills: skillsWithLevel("cooking", 2),
      });

      const result = pickBestCharacter(
        [bob, alice],
        "cooking",
        { x: 0, y: 0, z: 0 },
        () => false,
      );
      expect(result).toBe(alice.id);
    });

    it("priority still beats skill", () => {
      const alice = makeChar({
        name: "Alice",
        position: { x: 0, y: 0, z: 0 },
        workPriorities: { ...createDefaultWorkPriorities(), mining: 4 },
        skills: skillsWithLevel("mining", 15),
      });
      const bob = makeChar({
        name: "Bob",
        position: { x: 0, y: 0, z: 0 },
        workPriorities: { ...createDefaultWorkPriorities(), mining: 1 },
        skills: skillsWithLevel("mining", 1),
      });

      const result = pickBestCharacter(
        [alice, bob],
        "mining",
        { x: 0, y: 0, z: 0 },
        () => false,
      );
      expect(result).toBe(bob.id);
    });

    it("skill breaks tie before distance", () => {
      const alice = makeChar({
        name: "Alice",
        position: { x: 1, y: 0, z: 0 },
        skills: skillsWithLevel("construction", 3),
      });
      const bob = makeChar({
        name: "Bob",
        position: { x: 10, y: 0, z: 0 },
        skills: skillsWithLevel("construction", 10),
      });

      const result = pickBestCharacter(
        [alice, bob],
        "construction",
        { x: 0, y: 0, z: 0 },
        () => false,
      );
      // Bob is farther but much more skilled — skill wins over distance
      expect(result).toBe(bob.id);
    });
  });
});
