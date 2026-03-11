// =============================================================================
// COLONIST IDENTITY GENERATOR
// =============================================================================
// Procedurally generates colonist identities (name, age, gender) using
// deterministic seeded RNG for reproducible results.

import type { SeededRandom } from "../world/factories/world-factory";
import type { CharacterBiography, Gender } from "./types";

// =============================================================================
// NAME POOLS
// =============================================================================

const MALE_FIRST_NAMES = [
  "Aaron",
  "Blake",
  "Caleb",
  "Daniel",
  "Ethan",
  "Felix",
  "Grant",
  "Hugo",
  "Isaac",
  "James",
  "Kane",
  "Leo",
  "Marcus",
  "Nathan",
  "Oscar",
  "Patrick",
  "Quinn",
  "Reid",
  "Samuel",
  "Thomas",
  "Victor",
  "Wesley",
  "Xavier",
  "Yuri",
  "Zane",
  "Adrian",
  "Brock",
  "Cole",
  "Desmond",
  "Elias",
];

const FEMALE_FIRST_NAMES = [
  "Alice",
  "Brynn",
  "Clara",
  "Diana",
  "Elena",
  "Faye",
  "Grace",
  "Harper",
  "Iris",
  "Julia",
  "Kira",
  "Luna",
  "Maya",
  "Nora",
  "Olive",
  "Petra",
  "Quinn",
  "Rose",
  "Sage",
  "Thea",
  "Uma",
  "Vera",
  "Wren",
  "Xena",
  "Yara",
  "Zara",
  "Amber",
  "Blair",
  "Cora",
  "Daphne",
];

const LAST_NAMES = [
  "Ashwood",
  "Blackwell",
  "Cole",
  "Drake",
  "Ellis",
  "Frost",
  "Grant",
  "Hayes",
  "Ironwood",
  "Jensen",
  "Kessler",
  "Locke",
  "Monroe",
  "Nash",
  "Owens",
  "Palmer",
  "Reed",
  "Stone",
  "Torres",
  "Vale",
];

const NICKNAMES = [
  "Ace",
  "Bear",
  "Chip",
  "Doc",
  "Flash",
  "Grit",
  "Hawk",
  "Jinx",
  "Kit",
  "Lucky",
  "Moss",
  "Patch",
  "Red",
  "Spark",
  "Twitch",
];

// =============================================================================
// GENERATOR
// =============================================================================

/** Chance that a colonist gets a nickname (0-1) */
const NICKNAME_CHANCE = 0.4;

/** Minimum colonist age */
const MIN_AGE = 18;

/** Maximum colonist age */
const MAX_AGE = 65;

/**
 * Generate a weighted random age, biased toward 20-40.
 * Uses two uniform samples averaged together to create a bell-curve-like distribution.
 */
function generateAge(rng: SeededRandom): number {
  const a = rng.nextInt(MIN_AGE, MAX_AGE + 1);
  const b = rng.nextInt(MIN_AGE, MAX_AGE + 1);
  return Math.floor((a + b) / 2);
}

/**
 * Format a colonist's display name from biography components.
 * Format: "FirstName 'Nickname' LastName" or "FirstName LastName"
 */
export function formatColonistName(bio: CharacterBiography): string {
  if (bio.nickname) {
    return `${bio.firstName} '${bio.nickname}' ${bio.lastName}`;
  }
  return `${bio.firstName} ${bio.lastName}`;
}

/**
 * Generate a complete colonist identity using deterministic RNG.
 * Returns both the display name and full biography.
 */
export function generateColonistIdentity(rng: SeededRandom): {
  name: string;
  biography: CharacterBiography;
} {
  const gender: Gender = rng.chance(0.5) ? "male" : "female";
  const firstNames = gender === "male" ? MALE_FIRST_NAMES : FEMALE_FIRST_NAMES;

  const firstName = rng.pick(firstNames);
  const lastName = rng.pick(LAST_NAMES);
  const nickname = rng.chance(NICKNAME_CHANCE) ? rng.pick(NICKNAMES) : null;
  const age = generateAge(rng);

  const biography: CharacterBiography = {
    firstName,
    nickname,
    lastName,
    age,
    gender,
  };

  return {
    name: formatColonistName(biography),
    biography,
  };
}
