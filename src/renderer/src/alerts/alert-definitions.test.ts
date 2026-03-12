import { describe, expect, it } from "vitest";
import type { Character } from "../simulation/types";
import { createCharacter } from "../simulation/types";
import { evaluateAlerts } from "./alert-definitions";

function makeCharacter(overrides?: Partial<Character>): Character {
  return {
    ...createCharacter({ name: "Test", position: { x: 0, y: 0, z: 0 } }),
    ...overrides,
  };
}

describe("evaluateAlerts", () => {
  it("returns no alerts for healthy colonists", () => {
    const characters = [makeCharacter({ name: "Alice" })];
    const alerts = evaluateAlerts(characters);
    // Default character has full needs and no mental break
    // But control.mode defaults to "idle" — so "all idle" may trigger
    const nonIdleAlerts = alerts.filter((a) => a.id !== "all_colonists_idle");
    expect(nonIdleAlerts).toHaveLength(0);
  });

  it("detects starving colonists", () => {
    const characters = [
      makeCharacter({
        name: "Alice",
        needs: {
          hunger: 0.1,
          energy: 1,
          mood: 1,
          comfort: 1,
          recreation: 1,
          social: 1,
        },
      }),
    ];
    const alerts = evaluateAlerts(characters);
    const starvingAlert = alerts.find((a) => a.id === "colonist_starving");
    expect(starvingAlert).toBeDefined();
    expect(starvingAlert?.detail).toBe("Alice");
    expect(starvingAlert?.severity).toBe("critical");
  });

  it("detects exhausted colonists", () => {
    const characters = [
      makeCharacter({
        name: "Bob",
        needs: {
          hunger: 1,
          energy: 0.05,
          mood: 1,
          comfort: 1,
          recreation: 1,
          social: 1,
        },
      }),
    ];
    const alerts = evaluateAlerts(characters);
    const exhaustedAlert = alerts.find((a) => a.id === "colonist_exhausted");
    expect(exhaustedAlert).toBeDefined();
    expect(exhaustedAlert?.detail).toBe("Bob");
    expect(exhaustedAlert?.severity).toBe("warning");
  });

  it("detects active mental breaks", () => {
    const characters = [
      makeCharacter({
        name: "Carol",
        mentalBreak: { type: "sad_wander", startedAtTick: 0 },
      }),
    ];
    const alerts = evaluateAlerts(characters);
    const breakAlert = alerts.find((a) => a.id === "mental_break_active");
    expect(breakAlert).toBeDefined();
    expect(breakAlert?.detail).toBe("Carol");
    expect(breakAlert?.severity).toBe("critical");
  });

  it("detects very unhappy colonists (critical mood, no mental break)", () => {
    const characters = [
      makeCharacter({
        name: "Dave",
        needs: {
          hunger: 1,
          energy: 1,
          mood: 0.1,
          comfort: 1,
          recreation: 1,
          social: 1,
        },
      }),
    ];
    const alerts = evaluateAlerts(characters);
    const unhappyAlert = alerts.find((a) => a.id === "colonist_very_unhappy");
    expect(unhappyAlert).toBeDefined();
    expect(unhappyAlert?.detail).toBe("Dave");
  });

  it("does not flag unhappy colonists already in mental break", () => {
    const characters = [
      makeCharacter({
        name: "Eve",
        needs: {
          hunger: 1,
          energy: 1,
          mood: 0.1,
          comfort: 1,
          recreation: 1,
          social: 1,
        },
        mentalBreak: { type: "daze", startedAtTick: 0 },
      }),
    ];
    const alerts = evaluateAlerts(characters);
    const unhappyAlert = alerts.find((a) => a.id === "colonist_very_unhappy");
    expect(unhappyAlert).toBeUndefined();
  });

  it("detects all colonists idle", () => {
    const characters = [
      makeCharacter({ name: "Alice" }),
      makeCharacter({ name: "Bob" }),
    ];
    const alerts = evaluateAlerts(characters);
    const idleAlert = alerts.find((a) => a.id === "all_colonists_idle");
    expect(idleAlert).toBeDefined();
    expect(idleAlert?.severity).toBe("info");
  });

  it("does not flag idle when a colonist is moving", () => {
    const characters = [
      makeCharacter({ name: "Alice" }),
      makeCharacter({
        name: "Bob",
        movement: {
          speed: 2,
          path: null,
          pathIndex: 0,
          progress: 0,
          isMoving: true,
        },
      }),
    ];
    const alerts = evaluateAlerts(characters);
    const idleAlert = alerts.find((a) => a.id === "all_colonists_idle");
    expect(idleAlert).toBeUndefined();
  });

  it("lists multiple affected colonists in detail", () => {
    const characters = [
      makeCharacter({
        name: "Alice",
        needs: {
          hunger: 0.05,
          energy: 1,
          mood: 1,
          comfort: 1,
          recreation: 1,
          social: 1,
        },
      }),
      makeCharacter({
        name: "Bob",
        needs: {
          hunger: 0.1,
          energy: 1,
          mood: 1,
          comfort: 1,
          recreation: 1,
          social: 1,
        },
      }),
    ];
    const alerts = evaluateAlerts(characters);
    const starvingAlert = alerts.find((a) => a.id === "colonist_starving");
    expect(starvingAlert).toBeDefined();
    expect(starvingAlert?.detail).toBe("Alice, Bob");
  });

  it("returns empty array for no characters", () => {
    const alerts = evaluateAlerts([]);
    expect(alerts).toHaveLength(0);
  });
});
