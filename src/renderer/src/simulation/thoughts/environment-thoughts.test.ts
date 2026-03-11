import { describe, expect, it } from "vitest";
import { createCharacter } from "../types";
import type { EnvironmentContext } from "./thought-system";
import { evaluateConditionThoughts } from "./thought-system";

function makeCharacter() {
  return createCharacter({ name: "Test", position: { x: 0, y: 0, z: 0 } });
}

describe("environment beauty thoughts", () => {
  it("adds environment_beautiful for beauty >= 2.0", () => {
    const char = makeCharacter();
    const env: EnvironmentContext = { roomBeauty: 2.0, roomImpressiveness: 30 };
    const thoughts = evaluateConditionThoughts(char, env);
    expect(thoughts.has("environment_beautiful")).toBe(true);
    expect(thoughts.has("environment_pleasant")).toBe(false);
  });

  it("adds environment_pleasant for beauty >= 1.0 but < 2.0", () => {
    const char = makeCharacter();
    const env: EnvironmentContext = { roomBeauty: 1.5, roomImpressiveness: 20 };
    const thoughts = evaluateConditionThoughts(char, env);
    expect(thoughts.has("environment_pleasant")).toBe(true);
    expect(thoughts.has("environment_beautiful")).toBe(false);
  });

  it("adds environment_ugly for beauty <= -0.5 but > -1.5", () => {
    const char = makeCharacter();
    const env: EnvironmentContext = {
      roomBeauty: -0.5,
      roomImpressiveness: 10,
    };
    const thoughts = evaluateConditionThoughts(char, env);
    expect(thoughts.has("environment_ugly")).toBe(true);
    expect(thoughts.has("environment_hideous")).toBe(false);
  });

  it("adds environment_hideous for beauty <= -1.5", () => {
    const char = makeCharacter();
    const env: EnvironmentContext = { roomBeauty: -1.5, roomImpressiveness: 5 };
    const thoughts = evaluateConditionThoughts(char, env);
    expect(thoughts.has("environment_hideous")).toBe(true);
    expect(thoughts.has("environment_ugly")).toBe(false);
  });

  it("adds environment_impressive for impressiveness >= 60", () => {
    const char = makeCharacter();
    const env: EnvironmentContext = { roomBeauty: 0, roomImpressiveness: 65 };
    const thoughts = evaluateConditionThoughts(char, env);
    expect(thoughts.has("environment_impressive")).toBe(true);
  });

  it("does not add environment_impressive below threshold", () => {
    const char = makeCharacter();
    const env: EnvironmentContext = { roomBeauty: 0, roomImpressiveness: 50 };
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
    };
    const thoughts = evaluateConditionThoughts(char, env);
    expect(thoughts.has("environment_beautiful")).toBe(false);
    expect(thoughts.has("environment_ugly")).toBe(false);
  });

  it("can combine beautiful room with impressive room", () => {
    const char = makeCharacter();
    const env: EnvironmentContext = { roomBeauty: 2.5, roomImpressiveness: 70 };
    const thoughts = evaluateConditionThoughts(char, env);
    expect(thoughts.has("environment_beautiful")).toBe(true);
    expect(thoughts.has("environment_impressive")).toBe(true);
  });

  it("neutral beauty adds no thoughts", () => {
    const char = makeCharacter();
    const env: EnvironmentContext = { roomBeauty: 0.5, roomImpressiveness: 20 };
    const thoughts = evaluateConditionThoughts(char, env);
    expect(thoughts.has("environment_beautiful")).toBe(false);
    expect(thoughts.has("environment_pleasant")).toBe(false);
    expect(thoughts.has("environment_ugly")).toBe(false);
    expect(thoughts.has("environment_hideous")).toBe(false);
  });
});
