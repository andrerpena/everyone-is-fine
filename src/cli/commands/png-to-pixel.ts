import * as fs from "node:fs";
import * as path from "node:path";
import { Command } from "commander";
import { PNG } from "pngjs";
import {
  type Color,
  colorKey,
  colorToHex,
  findNearestPaletteColor,
  getCharForColor,
  loadPalette,
  type Palette,
} from "../lib/palette";

const DEFAULT_SPRITES_DIR = "src/renderer/public/sprites";

function extractColorsFromPng(png: PNG): Map<string, Color> {
  const colors = new Map<string, Color>();

  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const idx = (png.width * y + x) << 2;
      const color: Color = {
        r: png.data[idx],
        g: png.data[idx + 1],
        b: png.data[idx + 2],
        a: png.data[idx + 3],
      };

      const key = colorKey(color);
      if (!colors.has(key)) {
        colors.set(key, color);
      }
    }
  }

  return colors;
}

interface ColorRemapping {
  original: Color;
  remappedTo: string; // palette char
  remappedColor: Color;
}

function analyzeColorsForRemapping(
  colors: Map<string, Color>,
  palette: Palette,
): { remappings: ColorRemapping[]; colorMap: Map<string, string> } {
  const remappings: ColorRemapping[] = [];
  const colorMap = new Map<string, string>(); // colorKey -> palette char

  for (const color of colors.values()) {
    const key = colorKey(color);
    const exactChar = getCharForColor(palette, color);

    if (exactChar) {
      colorMap.set(key, exactChar);
    } else {
      // Find nearest palette color
      const nearest = findNearestPaletteColor(palette, color);
      colorMap.set(key, nearest.char);
      remappings.push({
        original: color,
        remappedTo: nearest.char,
        remappedColor: nearest.color,
      });
    }
  }

  return { remappings, colorMap };
}

function generateSourceTxt(png: PNG, colorMap: Map<string, string>): string {
  const lines: string[] = [];

  lines.push(`# ${png.width}x${png.height} sprite`);

  for (let y = 0; y < png.height; y++) {
    let row = "";
    for (let x = 0; x < png.width; x++) {
      const idx = (png.width * y + x) << 2;
      const color: Color = {
        r: png.data[idx],
        g: png.data[idx + 1],
        b: png.data[idx + 2],
        a: png.data[idx + 3],
      };

      const char = colorMap.get(colorKey(color));
      if (!char) {
        throw new Error(`Color not mapped: ${colorToHex(color)}`);
      }
      row += char;
    }
    lines.push(row);
  }

  lines.push(""); // Trailing newline
  return lines.join("\n");
}

function parseExistingSourceTxt(content: string): string[] {
  const lines = content.split("\n");
  const pixelGrid: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (trimmed === "" || trimmed.startsWith("#")) {
      continue;
    }

    // All non-comment, non-empty lines are pixel rows
    pixelGrid.push(trimmed);
  }

  return pixelGrid;
}

function generatePixelGridFromPng(
  png: PNG,
  colorMap: Map<string, string>,
): string[] {
  const rows: string[] = [];

  for (let y = 0; y < png.height; y++) {
    let row = "";
    for (let x = 0; x < png.width; x++) {
      const idx = (png.width * y + x) << 2;
      const color: Color = {
        r: png.data[idx],
        g: png.data[idx + 1],
        b: png.data[idx + 2],
        a: png.data[idx + 3],
      };

      const char = colorMap.get(colorKey(color));
      if (!char) {
        throw new Error(`Color not mapped: ${colorToHex(color)}`);
      }
      row += char;
    }
    rows.push(row);
  }

  return rows;
}

function findFoldersWithPng(baseDir: string): string[] {
  const folders: string[] = [];

  function scanDir(dir: string): void {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        // Skip the palette directory
        if (entry.name === "palette") continue;

        const subPath = path.join(dir, entry.name);
        const pngFiles = fs
          .readdirSync(subPath)
          .filter((f) => f.endsWith(".png"));

        if (pngFiles.length === 1) {
          folders.push(subPath);
        }
        // Always recurse to find nested sprites
        scanDir(subPath);
      }
    }
  }

  scanDir(baseDir);
  return folders;
}

function convertSingle(
  inputPath: string,
  palette: Palette,
  outputName?: string,
): void {
  let pngFile: string;
  let outputDir: string;

  const stat = fs.statSync(inputPath);
  if (stat.isDirectory()) {
    const pngFiles = fs
      .readdirSync(inputPath)
      .filter((f) => f.endsWith(".png"));
    if (pngFiles.length === 0) {
      console.error(`Error: No PNG files found in ${inputPath}`);
      process.exit(1);
    }
    if (pngFiles.length > 1) {
      console.error(
        `Error: Multiple PNG files found. Please specify which one to convert.`,
      );
      process.exit(1);
    }
    pngFile = path.join(inputPath, pngFiles[0]);
    outputDir = inputPath;
  } else {
    pngFile = inputPath;
    outputDir = path.dirname(inputPath);
  }

  const outputFile = path.join(outputDir, outputName || "source.txt");

  if (!fs.existsSync(pngFile)) {
    console.error(`Error: PNG file not found: ${pngFile}`);
    process.exit(1);
  }

  const buffer = fs.readFileSync(pngFile);
  const png = PNG.sync.read(buffer);

  console.log(`Reading: ${pngFile} (${png.width}x${png.height})`);

  // Analyze colors and create mapping (with remapping for non-palette colors)
  const colors = extractColorsFromPng(png);
  console.log(`Found ${colors.size} unique colors`);
  const { remappings, colorMap } = analyzeColorsForRemapping(colors, palette);

  if (remappings.length > 0) {
    console.log(`Remapping ${remappings.length} color(s) to nearest palette:`);
    for (const r of remappings) {
      console.log(
        `  ${colorToHex(r.original)} -> ${r.remappedTo} (${colorToHex(r.remappedColor)})`,
      );
    }
  }

  // Check for existing source.txt to compare pixel grids
  if (fs.existsSync(outputFile)) {
    const existingContent = fs.readFileSync(outputFile, "utf-8");
    const existingPixelGrid = parseExistingSourceTxt(existingContent);
    const newPixelGrid = generatePixelGridFromPng(png, colorMap);

    if (
      newPixelGrid.length === existingPixelGrid.length &&
      newPixelGrid.every((row, i) => row === existingPixelGrid[i])
    ) {
      console.log(`Unchanged: ${outputFile}`);
      return;
    }
  }

  const content = generateSourceTxt(png, colorMap);
  fs.writeFileSync(outputFile, content);
  console.log(`Created: ${outputFile}`);
}

function convertAll(baseDir: string, palette: Palette): void {
  console.log(`Scanning ${baseDir} for PNG files...\n`);

  const folders = findFoldersWithPng(baseDir);

  if (folders.length === 0) {
    console.log("No folders with single PNG files found.");
    return;
  }

  let updatedCount = 0;
  let unchangedCount = 0;
  let remappedCount = 0;
  let failCount = 0;

  for (const folder of folders) {
    try {
      const pngFiles = fs.readdirSync(folder).filter((f) => f.endsWith(".png"));
      const pngFile = path.join(folder, pngFiles[0]);
      const outputFile = path.join(folder, "source.txt");

      const buffer = fs.readFileSync(pngFile);
      const png = PNG.sync.read(buffer);

      // Analyze colors and create mapping (with remapping for non-palette colors)
      const colors = extractColorsFromPng(png);
      const { remappings, colorMap } = analyzeColorsForRemapping(
        colors,
        palette,
      );

      // Check for existing source.txt to compare pixel grids
      if (fs.existsSync(outputFile)) {
        const existingContent = fs.readFileSync(outputFile, "utf-8");
        const existingPixelGrid = parseExistingSourceTxt(existingContent);
        const newPixelGrid = generatePixelGridFromPng(png, colorMap);

        if (
          newPixelGrid.length === existingPixelGrid.length &&
          newPixelGrid.every((row, i) => row === existingPixelGrid[i])
        ) {
          console.log(`- ${path.relative(baseDir, outputFile)} (unchanged)`);
          unchangedCount++;
          continue;
        }
      }

      const content = generateSourceTxt(png, colorMap);
      fs.writeFileSync(outputFile, content);

      if (remappings.length > 0) {
        console.log(
          `✓ ${path.relative(baseDir, outputFile)} (remapped ${remappings.length} colors)`,
        );
        remappedCount++;
      } else {
        console.log(`✓ ${path.relative(baseDir, outputFile)} (updated)`);
      }
      updatedCount++;
    } catch (error) {
      console.log(
        `✗ ${path.relative(baseDir, folder)} - ${error instanceof Error ? error.message : error}`,
      );
      failCount++;
    }
  }

  console.log(
    `\nDone: ${updatedCount} updated (${remappedCount} with remapping), ${unchangedCount} unchanged, ${failCount} failed.`,
  );

  if (failCount > 0) {
    process.exit(1);
  }
}

export const pngToPixelCommand = new Command("png-to-pixel")
  .description(
    "Convert PNG files to source.txt pixel definitions (validates against universal palette)",
  )
  .argument("[input]", "Path to PNG file or folder (or omit with --all)")
  .option("-a, --all", "Process all sprites in the sprites directory")
  .option(
    "-d, --dir <path>",
    "Base directory for --all mode",
    DEFAULT_SPRITES_DIR,
  )
  .option("-o, --output <name>", "Output filename (default: source.txt)")
  .action(
    (
      input: string | undefined,
      options: { all?: boolean; dir: string; output?: string },
    ) => {
      try {
        // Load universal palette
        const palette = loadPalette();
        console.log(`Loaded palette with ${palette.entries.length} colors\n`);

        if (options.all) {
          const baseDir = path.resolve(options.dir);
          convertAll(baseDir, palette);
        } else if (input) {
          const inputPath = path.resolve(input);
          convertSingle(inputPath, palette, options.output);
        } else {
          console.error(
            "Error: Specify an input path or use --all to process all sprites",
          );
          process.exit(1);
        }
      } catch (error) {
        console.error(
          `Error: ${error instanceof Error ? error.message : error}`,
        );
        process.exit(1);
      }
    },
  );
