# Sprite Format

This document describes the ASCII-based pixel art format used for defining 32x32 sprites.

## Universal Palette

All sprites share a universal palette defined in:
```
src/renderer/public/sprites/palette/palette.txt
```

The palette maps single characters to colors. For example:
- `.` = transparent
- `0` = #000000 (Black)
- `W` = #FFFFFF (White)
- `C` = #7A5A10 (Dirt)
- `J` = #32CD32 (Lime)
- etc.

View the palette file for the complete list of available colors and their character codes.

## Directory Structure

Each sprite lives in its own folder under `src/renderer/public/sprites/`:

```
src/renderer/public/sprites/
  palette/
    palette.txt          # Universal color palette (shared by all sprites)
    palette.gpl          # GIMP palette format (for use in image editors)
  characters/
    male-1/
      source.txt         # ASCII pixel grid (source of truth)
      male-1.png         # Generated PNG output
  terrain/
    soil/
      source.txt
      soil.png
  structures/
    boulder/
      source.txt
      boulder.png
```

## Source File Format

The `source.txt` file contains **only the pixel grid** (no palette section - colors come from the universal palette).

### Example

```
# 32x32 sprite
................................
................................
...........HHHHHH...............
..........HIIIIIIH..............
.........HIIJJJJIIH.............
........HIIIJJJJIIIH............
.......HIIIIJJJJIIIIH...........
................................
```

### Rules

- Lines starting with `#` are comments (optional)
- Each non-comment, non-empty line is a row of pixels
- Exactly 32 rows of exactly 32 characters each
- Each character must exist in the universal palette
- If a character is not in the palette, the conversion will fail

## CLI Commands

### pixel-to-png

Convert source.txt to PNG:

```bash
# Single sprite
npm run cli -- pixel-to-png src/renderer/public/sprites/terrain/soil

# All sprites
npm run cli -- pixel-to-png --all
```

Options:
| Option | Description |
|--------|-------------|
| `-a, --all` | Process all sprites |
| `-d, --dir <path>` | Base directory (default: src/renderer/public/sprites) |
| `-s, --size <number>` | Tile size in pixels (default: 32) |
| `-o, --output <name>` | Output filename without extension |

### png-to-pixel

Convert PNG to source.txt. Colors not in the palette are automatically remapped to the nearest palette color (by RGB distance):

```bash
# Single sprite (folder or PNG file path)
npm run cli -- png-to-pixel src/renderer/public/sprites/terrain/soil
npm run cli -- png-to-pixel src/renderer/public/sprites/terrain/soil/soil.png

# All sprites
npm run cli -- png-to-pixel --all
```

Non-palette colors are remapped to the nearest match and reported in the console output. If a `source.txt` already exists and the pixel grid is unchanged, the file is skipped.

Options:
| Option | Description |
|--------|-------------|
| `-a, --all` | Process all sprites |
| `-d, --dir <path>` | Base directory (default: src/renderer/public/sprites) |
| `-o, --output <name>` | Output filename (default: source.txt) |

## Workflow

### Creating a new sprite

1. Create a new folder under `src/renderer/public/sprites/<category>/`
2. Create `source.txt` with the pixel grid using characters from the universal palette
3. Run `npm run cli -- pixel-to-png <folder-path>`
4. The PNG is generated in the same folder

### Importing an existing PNG

1. Place the PNG in its sprite folder
2. Run `npm run cli -- png-to-pixel <folder-path>`
3. The command generates `source.txt` from the PNG
4. Any non-palette colors are automatically remapped to the nearest palette color — review the console output for remappings

### Editing sprites

For manual edits, you can:
1. Edit `source.txt` directly using palette characters
2. Run `pixel-to-png` to regenerate the PNG

Or:
1. Edit the PNG in an image editor (using only palette colors)
2. Run `png-to-pixel` to regenerate the source.txt

## Palette Format

The palette file uses this format:
```
# Comment
char = #RRGGBB  Name
```

Example:
```
. = transparent    Void
0 = #000000        Black
W = #FFFFFF        White
J = #32CD32        Lime
```
