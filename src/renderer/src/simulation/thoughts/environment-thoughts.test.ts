import { describe, expect, it } from "vitest";
import { createCharacter } from "../types";
import type { EnvironmentContext } from "./thought-system";
import {
  COLD_THRESHOLD,
  evaluateConditionThoughts,
  FREEZING_THRESHOLD,
  HOT_THRESHOLD,
  SWELTERING_THRESHOLD,
} from "./thought-system";

function makeCharacter() {
  return createCharacter({ name: "Test", position: { x: 0, y: 0, z: 0 } });
}

describe("environment beauty thoughts", () => {
  it("adds environment_beautiful for beauty >= 2.0", () => {
    const char = makeCharacter();
    const env: EnvironmentContext = {
      roomBeauty: 2.0,
      roomImpressiveness: 30,
      temperature: null,
    };
    const thoughts = evaluateConditionThoughts(char, env);
    expect(thoughts.has("environment_beautiful")).toBe(true);
    expect(thoughts.has("environment_pleasant")).toBe(false);
  });

  it("adds environment_pleasant for beauty >= 1.0 but < 2.0", () => {
    const char = makeCharacter();
    const env: EnvironmentContext = {
      roomBeauty: 1.5,
      roomImpressiveness: 20,
      temperature: null,
    };
    const thoughts = evaluateConditionThoughts(char, env);
    expect(thoughts.has("environment_pleasant")).toBe(true);
    expect(thoughts.has("environment_beautiful")).toBe(false);
  });

  it("adds environment_ugly for beauty <= -0.5 but > -1.5", () => {
    const char = makeCharacter();
    const env: EnvironmentContext = {
      roomBeauty: -0.5,
      roomImpressiveness: 10,
      temperature: null,
    };
    const thoughts = evaluateConditionThoughts(char, env);
    expect(thoughts.has("environment_ugly")).toBe(true);
    expect(thoughts.has("environment_hideous")).toBe(false);
  });

  it("adds environment_hideous for beauty <= -1.5", () => {
    const char = makeCharacter();
    const env: EnvironmentContext = {
      roomBeauty: -1.5,
      roomImpressiveness: 5,
      temperature: null,
    };
    const thoughts = evaluateConditionThoughts(char, env);
    expect(thoughts.has("environment_hideous")).toBe(true);
    expect(thoughts.has("environment_ugly")).toBe(false);
  });

  it("adds environment_impressive for impressiveness >= 60", () => {
    const char = makeCharacter();
    const env: EnvironmentContext = {
      roomBeauty: 0,
      roomImpressiveness: 65,
      temperature: null,
    };
    const thoughts = evaluateConditionThoughts(char, env);
    expect(thoughts.has("environment_impressive")).toBe(true);
  });

  it("does not add environment_impressive below threshold", () => {
    const char = makeCharacter();
    const env: EnvironmentContext = {
      roomBeauty: 0,
      roomImpressiveness: 50,
      temperature: null,
    };
    const thoughts = evaluateConditionThoughts(char, env);
    expect(thoughts.has("environment_impressive")).toBe(false);
  });

  it("adds no environment thoughts when context is undefined", () => {
    const char = makeCharacter();
    const thoughts = evaluateConditionThoughts(char);
    expect(thoughts.has("environment_beautiful")).toBe(false);
    expect(thoughts.has("environment_pleasant")).toBe(false);
    expect(thoughts.has("environment_ugly")).toBe(false);
    expect(thoughts.has("environment_hideous")).toBe(false);
    expect(thoughts.has("environment_impressive")).toBe(false);
  });

  it("adds no environment thoughts when beauty is null (outdoors)", () => {
    const char = makeCharacter();
    const env: EnvironmentContext = {
      roomBeauty: null,
      roomImpressiveness: null,
      temperature: null,
    };
    const thoughts = evaluateConditionThoughts(char, env);
    expect(thoughts.has("environment_beautiful")).toBe(false);
    expect(thoughts.has("environment_ugly")).toBe(false);
  });

  it("can combine beautiful room with impressive room", () => {
    const char = makeCharacter();
    const env: EnvironmentContext = {
      roomBeauty: 2.5,
      roomImpressiveness: 70,
      temperature: null,
    };
    const thoughts = evaluateConditionThoughts(char, env);
    expect(thoughts.has("environment_beautiful")).toBe(true);
    expect(thoughts.has("environment_impressive")).toBe(true);
  });

  it("neutral beauty adds no thoughts", () => {
    const char = makeCharacter();
    const env: EnvironmentContext = {
      roomBeauty: 0.5,
      roomImpressiveness: 20,
      temperature: null,
    };
    const thoughts = evaluateConditionThoughts(char, env);
    expect(thoughts.has("environment_beautiful")).toBe(false);
    expect(thoughts.has("environment_pleasant")).toBe(false);
    expect(thoughts.has("environment_ugly")).toBe(false);
    expect(thoughts.has("environment_hideous")).toBe(false);
  });
});

describe("temperature thoughts", () => {
  it("adds freezing thought below freezing threshold", () => {
    const char = makeCharacter();
    const env: EnvironmentContext = {
      roomBeauty: null,
      roomImpressiveness: null,
      temperature: FREEZING_THRESHOLD - 1,
    };
    const thoughts = evaluateConditionThoughts(char, env);
    expect(thoughts.has("freezing")).toBe(true);
    expect(thoughts.has("cold")).toBe(false);
  });

  it("adds cold thought between freezing and cold threshold", () => {
    const char = makeCharacter();
    const env: EnvironmentContext = {
      roomBeauty: null,
      roomImpressiveness: null,
      temperature: 0,
    };
    const thoughts = evaluateConditionThoughts(char, env);
    expect(thoughts.has("cold")).toBe(true);
    expect(thoughts.has("freezing")).toBe(false);
  });

  it("adds hot thought between hot and sweltering threshold", () => {
    const char = makeCharacter();
    const env: EnvironmentContext = {
      roomBeauty: null,
      roomImpressiveness: null,
      temperature: 40,
    };
    const thoughts = evaluateConditionThoughts(char, env);
    expect(thoughts.has("hot")).toBe(true);
    expect(thoughts.has("sweltering")).toBe(false);
  });

  it("adds sweltering thought above sweltering threshold", () => {
    const char = makeCharacter();
    const env: EnvironmentContext = {
      roomBeauty: null,
      roomImpressiveness: null,
      temperature: SWELTERING_THRESHOLD + 1,
    };
    const thoughts = evaluateConditionThoughts(char, env);
    expect(thoughts.has("sweltering")).toBe(true);
    expect(thoughts.has("hot")).toBe(false);
  });

  it("adds no temperature thoughts in comfortable range", () => {
    const char = makeCharacter();
    const env: EnvironmentContext = {
      roomBeauty: null,
      roomImpressiveness: null,
      temperature: 20,
    };
    const thoughts = evaluateConditionThoughts(char, env);
    expect(thoughts.has("freezing")).toBe(false);
    expect(thoughts.has("cold")).toBe(false);
    expect(thoughts.has("hot")).toBe(false);
    expect(thoughts.has("sweltering")).toBe(false);
  });

  it("adds no temperature thoughts when temperature is null", () => {
    const char = makeCharacter();
    const env: EnvironmentContext = {
      roomBeauty: null,
      roomImpressiveness: null,
      temperature: null,
    };
    const thoughts = evaluateConditionThoughts(char, env);
    expect(thoughts.has("freezing")).toBe(false);
    expect(thoughts.has("cold")).toBe(false);
    expect(thoughts.has("hot")).toBe(false);
    expect(thoughts.has("sweltering")).toBe(false);
  });

  it("adds cold at exactly the cold threshold boundary", () => {
    const char = makeCharacter();
    const env: EnvironmentContext = {
      roomBeauty: null,
      roomImpressiveness: null,
      temperature: COLD_THRESHOLD - 0.1,
    };
    const thoughts = evaluateConditionThoughts(char, env);
    expect(thoughts.has("cold")).toBe(true);
  });

  it("adds hot at just above the hot threshold", () => {
    const char = makeCharacter();
    const env: EnvironmentContext = {
      roomBeauty: null,
      roomImpressiveness: null,
      temperature: HOT_THRESHOLD + 0.1,
    };
    const thoughts = evaluateConditionThoughts(char, env);
    expect(thoughts.has("hot")).toBe(true);
  });
});
