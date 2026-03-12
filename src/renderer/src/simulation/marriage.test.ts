import { describe, expect, it } from "vitest";
import { MARRIAGE_OPINION_THRESHOLD } from "./relationships";
import {
  MIN_PARTNERSHIP_TICKS,
  PROPOSAL_CHANCE,
  WEDDING_ATTENDEE_PROXIMITY,
} from "./social-interaction-system";

describe("Marriage Constants", () => {
  it("marriage opinion threshold is higher than romance threshold (75)", () => {
    expect(MARRIAGE_OPINION_THRESHOLD).toBeGreaterThan(75);
  });

  it("proposal chance is between 0 and 1", () => {
    expect(PROPOSAL_CHANCE).toBeGreaterThan(0);
    expect(PROPOSAL_CHANCE).toBeLessThan(1);
  });

  it("minimum partnership ticks is positive", () => {
    expect(MIN_PARTNERSHIP_TICKS).toBeGreaterThan(0);
  });

  it("wedding attendee proximity is larger than chat proximity (2)", () => {
    expect(WEDDING_ATTENDEE_PROXIMITY).toBeGreaterThan(2);
  });
});

describe("Marriage eligibility logic", () => {
  it("requires both opinions above threshold", () => {
    const aOpinion = 90;
    const bOpinion = 90;
    const eligible =
      aOpinion >= MARRIAGE_OPINION_THRESHOLD &&
      bOpinion >= MARRIAGE_OPINION_THRESHOLD;
    expect(eligible).toBe(true);
  });

  it("rejects when one opinion is below threshold", () => {
    const aOpinion = 90;
    const bOpinion = 70;
    const eligible =
      aOpinion >= MARRIAGE_OPINION_THRESHOLD &&
      bOpinion >= MARRIAGE_OPINION_THRESHOLD;
    expect(eligible).toBe(false);
  });

  it("rejects when both opinions are below threshold", () => {
    const aOpinion = 50;
    const bOpinion = 60;
    const eligible =
      aOpinion >= MARRIAGE_OPINION_THRESHOLD &&
      bOpinion >= MARRIAGE_OPINION_THRESHOLD;
    expect(eligible).toBe(false);
  });

  it("requires minimum partnership duration", () => {
    const partnershipDuration = 1000;
    const eligible = partnershipDuration >= MIN_PARTNERSHIP_TICKS;
    expect(eligible).toBe(false);
  });

  it("allows proposal after minimum partnership duration", () => {
    const partnershipDuration = MIN_PARTNERSHIP_TICKS + 100;
    const eligible = partnershipDuration >= MIN_PARTNERSHIP_TICKS;
    expect(eligible).toBe(true);
  });

  it("attendee check uses Manhattan distance", () => {
    const ax = 10;
    const ay = 10;
    const bx = 15;
    const by = 14;
    const dist = Math.abs(ax - bx) + Math.abs(ay - by);
    expect(dist).toBe(9);
    expect(dist <= WEDDING_ATTENDEE_PROXIMITY).toBe(true);
  });

  it("excludes distant colonists from wedding", () => {
    const ax = 10;
    const ay = 10;
    const bx = 25;
    const by = 25;
    const dist = Math.abs(ax - bx) + Math.abs(ay - by);
    expect(dist).toBe(30);
    expect(dist <= WEDDING_ATTENDEE_PROXIMITY).toBe(false);
  });
});
