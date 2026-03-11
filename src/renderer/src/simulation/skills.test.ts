import { describe, expect, it } from "vitest";
import {
  type CharacterSkills,
  createDefaultSkills,
  getSkillProgress,
  grantExperience,
  MAX_SKILL_LEVEL,
  xpForNextLevel,
} from "./skills";

describe("xpForNextLevel", () => {
  it("returns (level + 1) * 100", () => {
    expect(xpForNextLevel(0)).toBe(100);
    expect(xpForNextLevel(1)).toBe(200);
    expect(xpForNextLevel(5)).toBe(600);
    expect(xpForNextLevel(19)).toBe(2000);
  });
});

describe("grantExperience", () => {
  it("adds XP without leveling up", () => {
    const skills = createDefaultSkills();
    const result = grantExperience(skills, "mining", 50);

    expect(result.leveledUp).toBe(false);
    expect(result.levelsGained).toBe(0);
    expect(result.skills.mining.level).toBe(0);
    expect(result.skills.mining.experience).toBe(50);
  });

  it("triggers a single level-up", () => {
    const skills = createDefaultSkills();
    const result = grantExperience(skills, "mining", 100);

    expect(result.leveledUp).toBe(true);
    expect(result.levelsGained).toBe(1);
    expect(result.skills.mining.level).toBe(1);
    expect(result.skills.mining.experience).toBe(0);
  });

  it("handles multiple level-ups in one grant", () => {
    const skills = createDefaultSkills();
    // Level 0→1 costs 100, level 1→2 costs 200 = 300 total
    const result = grantExperience(skills, "mining", 350);

    expect(result.leveledUp).toBe(true);
    expect(result.levelsGained).toBe(2);
    expect(result.skills.mining.level).toBe(2);
    expect(result.skills.mining.experience).toBe(50);
  });

  it("caps at MAX_SKILL_LEVEL", () => {
    const skills = createDefaultSkills();
    // Grant massive XP to exceed all levels
    const result = grantExperience(skills, "mining", 1_000_000);

    expect(result.skills.mining.level).toBe(MAX_SKILL_LEVEL);
    expect(result.skills.mining.experience).toBe(0);
  });

  it("does not grant XP when already at max level", () => {
    const skills: CharacterSkills = {
      ...createDefaultSkills(),
      mining: { level: MAX_SKILL_LEVEL, experience: 0 },
    };
    const result = grantExperience(skills, "mining", 500);

    expect(result.leveledUp).toBe(false);
    expect(result.levelsGained).toBe(0);
    expect(result.skills.mining.level).toBe(MAX_SKILL_LEVEL);
    expect(result.skills.mining.experience).toBe(0);
  });

  it("does not mutate the original skills object", () => {
    const skills = createDefaultSkills();
    const result = grantExperience(skills, "mining", 100);

    expect(skills.mining.level).toBe(0);
    expect(skills.mining.experience).toBe(0);
    expect(result.skills).not.toBe(skills);
  });
});

describe("getSkillProgress", () => {
  it("returns 0 for a fresh skill", () => {
    expect(getSkillProgress({ level: 0, experience: 0 })).toBe(0);
  });

  it("returns correct fraction", () => {
    // Level 0→1 needs 100 XP, so 50/100 = 0.5
    expect(getSkillProgress({ level: 0, experience: 50 })).toBe(0.5);
  });

  it("returns 1 at max level", () => {
    expect(getSkillProgress({ level: MAX_SKILL_LEVEL, experience: 0 })).toBe(1);
  });
});
