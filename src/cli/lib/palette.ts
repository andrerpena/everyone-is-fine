import * as fs from "node:fs";
import * as path from "node:path";

const PALETTE_PATH = "src/renderer/public/sprites/palette/palette.txt";

export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface PaletteEntry {
  char: string;
  color: Color;
  name: string;
}

export interface Palette {
  entries: PaletteEntry[];
  charToColor: Map<string, Color>;
  colorToChar: Map<string, string>;
}

function colorKey(color: Color): string {
  return `${color.r},${color.g},${color.b},${color.a}`;
}

function parseHexColor(hex: string): Color {
  const cleanHex = hex.replace("#", "");

  if (cleanHex.length === 6) {
    return {
      r: Number.parseInt(cleanHex.slice(0, 2), 16),
      g: Number.parseInt(cleanHex.slice(2, 4), 16),
      b: Number.parseInt(cleanHex.slice(4, 6), 16),
      a: 255,
    };
  }

  if (cleanHex.length === 8) {
    return {
      r: Number.parseInt(cleanHex.slice(0, 2), 16),
      g: Number.parseInt(cleanHex.slice(2, 4), 16),
      b: Number.parseInt(cleanHex.slice(4, 6), 16),
      a: Number.parseInt(cleanHex.slice(6, 8), 16),
    };
  }

  throw new Error(`Invalid hex color: ${hex}`);
}

export function loadPalette(basePath?: string): Palette {
  const palettePath = basePath
    ? path.join(basePath, PALETTE_PATH)
    : path.resolve(PALETTE_PATH);

  if (!fs.existsSync(palettePath)) {
    throw new Error(`Palette file not found: ${palettePath}`);
  }

  const content = fs.readFileSync(palettePath, "utf-8");
  const lines = content.split("\n");

  const entries: PaletteEntry[] = [];
  const charToColor = new Map<string, Color>();
  const colorToChar = new Map<string, string>();

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (trimmed === "" || trimmed.startsWith("#")) {
      continue;
    }

    // Parse palette entry: "char = #hexcolor  Name" or "char = transparent  Name"
    const match = trimmed.match(/^(.)[ ]*=[ ]*([#\w]+)[ ]+(.+)$/);
    if (match) {
      const [, char, colorValue, name] = match;
      let color: Color;

      if (colorValue.toLowerCase() === "transparent") {
        color = { r: 0, g: 0, b: 0, a: 0 };
      } else {
        color = parseHexColor(colorValue);
      }

      entries.push({ char, color, name: name.trim() });
      charToColor.set(char, color);
      colorToChar.set(colorKey(color), char);
    }
  }

  if (entries.length === 0) {
    throw new Error("No palette entries found in palette.txt");
  }

  return { entries, charToColor, colorToChar };
}

export function colorToHex(color: Color): string {
  const r = color.r.toString(16).padStart(2, "0").toUpperCase();
  const g = color.g.toString(16).padStart(2, "0").toUpperCase();
  const b = color.b.toString(16).padStart(2, "0").toUpperCase();

  if (color.a < 255) {
    const a = color.a.toString(16).padStart(2, "0").toUpperCase();
    return `#${r}${g}${b}${a}`;
  }

  return `#${r}${g}${b}`;
}

export function getCharForColor(palette: Palette, color: Color): string | null {
  return palette.colorToChar.get(colorKey(color)) || null;
}

export function getColorForChar(palette: Palette, char: string): Color | null {
  return palette.charToColor.get(char) || null;
}

/**
 * Calculate the squared Euclidean distance between two colors in RGB space.
 * Using squared distance avoids the sqrt operation for comparisons.
 */
function colorDistanceSquared(c1: Color, c2: Color): number {
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return dr * dr + dg * dg + db * db;
}

/**
 * Find the nearest color in the palette to the given color.
 * Returns the palette entry with the closest RGB distance.
 * Handles transparency: fully transparent pixels map to the transparent entry.
 */
export function findNearestPaletteColor(
  palette: Palette,
  color: Color,
): PaletteEntry {
  // Handle fully transparent pixels
  if (color.a === 0) {
    const transparentEntry = palette.entries.find((e) => e.color.a === 0);
    if (transparentEntry) {
      return transparentEntry;
    }
  }

  // Find exact match first
  const exactChar = palette.colorToChar.get(colorKey(color));
  if (exactChar) {
    const entry = palette.entries.find((e) => e.char === exactChar);
    if (entry) return entry;
  }

  // Find nearest color by RGB distance (only consider opaque palette colors)
  let nearest = palette.entries[0];
  let minDistance = Number.MAX_SAFE_INTEGER;

  for (const entry of palette.entries) {
    // Skip transparent entry for non-transparent pixels
    if (entry.color.a === 0) continue;

    const distance = colorDistanceSquared(color, entry.color);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = entry;
    }
  }

  return nearest;
}

export { colorKey };
