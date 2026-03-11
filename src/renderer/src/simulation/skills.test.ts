import { describe, expect, it } from "vitest";
import {
  type CharacterSkills,
  createDefaultSkills,
  formatSkillsSummary,
  getSkillProgress,
  getWorkSpeedMultiplier,
  grantExperience,
  MAX_SKILL_LEVEL,
  PASSION_XP_MULTIPLIERS,
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
    const result = grantExperience(skills, "mining", 1_000_000);

    expect(result.skills.mining.level).toBe(MAX_SKILL_LEVEL);
    expect(result.skills.mining.experience).toBe(0);
  });

  it("does not grant XP when already at max level", () => {
    const skills: CharacterSkills = {
      ...createDefaultSkills(),
      mining: { level: MAX_SKILL_LEVEL, experience: 0, passion: "none" },
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

  it("applies minor passion 1.5x XP multiplier", () => {
    const skills: CharacterSkills = {
      ...createDefaultSkills(),
      mining: { level: 0, experience: 0, passion: "minor" },
    };
    // 100 * 1.5 = 150 XP → level 0→1 costs 100, leftover 50
    const result = grantExperience(skills, "mining", 100);

    expect(result.leveledUp).toBe(true);
    expect(result.levelsGained).toBe(1);
    expect(result.skills.mining.level).toBe(1);
    expect(result.skills.mining.experience).toBe(50);
  });

  it("applies major passion 2x XP multiplier", () => {
    const skills: CharacterSkills = {
      ...createDefaultSkills(),
      mining: { level: 0, experience: 0, passion: "major" },
    };
    // 100 * 2 = 200 XP → level 0→1 costs 100, level 1→2 costs 200, leftover 0→1 level up, 100 left
    const result = grantExperience(skills, "mining", 100);

    expect(result.leveledUp).toBe(true);
    expect(result.levelsGained).toBe(1);
    expect(result.skills.mining.level).toBe(1);
    expect(result.skills.mining.experience).toBe(100);
  });

  it("preserves passion field after granting experience", () => {
    const skills: CharacterSkills = {
      ...createDefaultSkills(),
      mining: { level: 0, experience: 0, passion: "major" },
    };
    const result = grantExperience(skills, "mining", 50);
    expect(result.skills.mining.passion).toBe("major");
  });
});

describe("PASSION_XP_MULTIPLIERS", () => {
  it("has correct multiplier values", () => {
    expect(PASSION_XP_MULTIPLIERS.none).toBe(1);
    expect(PASSION_XP_MULTIPLIERS.minor).toBe(1.5);
    expect(PASSION_XP_MULTIPLIERS.major).toBe(2);
  });
});

describe("getSkillProgress", () => {
  it("returns 0 for a fresh skill", () => {
    expect(getSkillProgress({ level: 0, experience: 0, passion: "none" })).toBe(
      0,
    );
  });

  it("returns correct fraction", () => {
    expect(
      getSkillProgress({ level: 0, experience: 50, passion: "none" }),
    ).toBe(0.5);
  });

  it("returns 1 at max level", () => {
    expect(
      getSkillProgress({
        level: MAX_SKILL_LEVEL,
        experience: 0,
        passion: "none",
      }),
    ).toBe(1);
  });
});

describe("getWorkSpeedMultiplier", () => {
  it("returns 1.0 at level 0", () => {
    expect(getWorkSpeedMultiplier(0)).toBe(1.0);
  });

  it("returns 1.5 at level 10", () => {
    expect(getWorkSpeedMultiplier(10)).toBe(1.5);
  });

  it("returns 2.0 at level 20", () => {
    expect(getWorkSpeedMultiplier(20)).toBe(2.0);
  });

  it("caps at MAX_SKILL_LEVEL", () => {
    expect(getWorkSpeedMultiplier(25)).toBe(2.0);
  });
});

describe("createDefaultSkills", () => {
  it("sets all passions to none", () => {
    const skills = createDefaultSkills();
    for (const id of Object.keys(skills) as Array<keyof typeof skills>) {
      expect(skills[id].passion).toBe("none");
    }
  });
});

describe("formatSkillsSummary", () => {
  it("shows passion indicators", () => {
    const skills: CharacterSkills = {
      ...createDefaultSkills(),
      mining: { level: 5, experience: 0, passion: "major" },
      cooking: { level: 3, experience: 0, passion: "minor" },
      melee: { level: 2, experience: 0, passion: "none" },
    };
    const summary = formatSkillsSummary(skills);
    expect(summary).toContain("Mining 5 \u2605\u2605");
    expect(summary).toContain("Cooking 3 \u2605");
    expect(summary).toContain("Melee 2");
    // Melee should NOT have a star
    expect(summary).not.toContain("Melee 2 \u2605");
  });
});
