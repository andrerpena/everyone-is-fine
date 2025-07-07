# Color System

All colors — both in-game (Pixi.js) and UI (CSS variables) — are centralized in the theming system. Themes define base colors, and users can override any color via the Settings JSON editor.

## Architecture

```
Theme definition
  ├── gameColors (hex strings)     → Pixi.js renderers
  └── colors: UIColors (oklch/hex) → CSS variables
       + User config overrides ("theme": { ... })
                  |
         splitThemeOverrides()
          ├── "ui.*" keys  → injectUIColorOverrides() → CSS variables
          └── other keys   → deep merge → useGameColorStore.resolve() → Pixi
```

### Game Colors

All game colors are stored as `#RRGGBB` hex strings in theme definitions. At resolution time, they are converted to the format each consumer needs:

| Consumer | Format | Conversion |
|----------|--------|------------|
| Pixi.js renderers | `0xRRGGBB` number | `hexToPixi()` |
| Canvas 2D (minimap terrain) | `[r, g, b, a]` tuple | `hexToRGBA()` |
| Canvas 2D (strokes/fills) | `"#RRGGBB"` string | Used directly |

### UI Colors

UI colors (`UIColors` type) can be any valid CSS color string (oklch, hex, rgb, etc.). They are converted to CSS variables via `injectThemeVariables()` on mount and `injectUIColorOverrides()` on config change.

## Key Files

| File | Purpose |
|------|---------|
| `src/renderer/src/theming/theme.ts` | `GameColors`, `UIColors`, and `ColonyTheme` interfaces |
| `src/renderer/src/theming/default-game-colors.ts` | Default values for all game colors |
| `src/renderer/src/theming/game-color-store.ts` | Zustand store with precomputed `ResolvedGameColors` |
| `src/renderer/src/theming/color-utils.ts` | `hexToPixi`, `hexToRGBA`, `splitThemeOverrides`, etc. |
| `src/renderer/src/theming/runtime-theme-generator.ts` | CSS variable injection (`injectThemeVariables`, `injectUIColorOverrides`) |
| `src/renderer/src/theming/themes/dark.ts` | Dark theme definition |
| `src/renderer/src/context/ColonyContext.tsx` | Resolves colors on theme/config change |
| `src/renderer/src/config/config-schema.ts` | JSON schema with autocomplete for color paths |
| `src/renderer/src/lib/palette-texture-manager.ts` | Canvas-based sprite palette color replacement |

## Color Groups

The `GameColors` interface organizes colors by domain:

| Group | Examples | Used by |
|-------|----------|---------|
| `world` | background, gridLine, worldBoundary, infoText, itemFallbackDot | World.tsx |
| `selection` | highlight, hoverFill, pathLine | World.tsx, CharacterRenderer, PathRenderer |
| `characters` | colonistPalette, colonistFallback, minimapDot | GameScreen, MiniMapWidget |
| `jobs` | chop, mine, move, defaultJob, indicatorBorder | CharacterRenderer |
| `progressBar` | background, fill, border | JobProgressRenderer |
| `structures` | `Record<StructureType, string>` (19 entries) | World.tsx, MiniMapWidget |
| `terrain` | `Record<TerrainType, string>` (13 entries) | MiniMapWidget |
| `minimap` | background, viewportRect | MiniMapWidget |
| `heatmaps` | temperature, moisture, movementCost (color scales) | HeatMapRenderer |
| `palette` | 31 sprite palette colors (black, forest, water, etc.) | PaletteTextureManager |

## User Overrides

Users override colors in the Settings widget (Overrides tab) using a unified `"theme"` config key:

```json
{
  "theme": {
    "world.background": "#0a0a1e",
    "terrain.soil": "#aa8855",
    "palette.dirt": "#aa6633",
    "ui.background": "oklch(0.2 0 0)",
    "ui.primary": "#ff6600"
  }
}
```

- Keys starting with `ui.` override UI colors (CSS variables)
- All other keys override game colors (Pixi.js)

The Monaco editor provides:
- **Autocomplete** for all known color paths (with default values shown)
- **Inline color swatches** next to hex values
- **Native color picker** popup when clicking a swatch

### How overrides are applied

1. `ColonyContext` reads the unified `"theme"` config and splits it via `splitThemeOverrides()`
2. **Game overrides**: applied via `setNestedValue()` to the theme's `gameColors`, then `useGameColorStore.resolve()` precomputes all format variants
3. **UI overrides**: applied via `injectUIColorOverrides()` which updates CSS variables in a separate `<style>` element
4. Both update live when config changes

## Palette Overrides

Sprite palette colors (31 colors from `palette.txt`) can be overridden to change how sprites look at runtime. The `PaletteTextureManager` draws sprites to canvas, replaces matching palette pixels, and updates the Pixi texture source in place — all sprites update automatically.

```json
{
  "theme": {
    "palette.black": "#ffffff",
    "palette.forest": "#004400"
  }
}
```

## Adding a New Color

1. Add the field to the appropriate group in `GameColors` (in `theme.ts`)
2. Add a default value in `default-game-colors.ts`
3. Add the resolved field to `ResolvedGameColors` and the `resolveGameColors()` function in `game-color-store.ts`
4. Use it in the renderer via `this.colors.group.field` (Pixi) or `useGameColorStore` (React/Canvas)

The new color will automatically appear in the Monaco editor autocomplete and be overridable by users.

## Adding a New Theme

1. Create a new file in `src/renderer/src/theming/themes/`
2. Import `defaultGameColors` and override specific sections:

```typescript
import { defaultGameColors } from "../default-game-colors";
import type { ColonyTheme } from "../theme";

export const myTheme: ColonyTheme = {
  id: "my-theme",
  name: "My Theme",
  type: "dark",
  colors: { /* UI colors in oklch */ },
  gameColors: {
    ...defaultGameColors,
    world: {
      ...defaultGameColors.world,
      background: "#0d0d1a",
    },
  },
};
```

3. Register it in `src/renderer/src/theming/themes/index.ts`

## Live Updates

All renderers support live color updates:

- **Pixi.js renderers** (`CharacterRenderer`, `PathRenderer`, `JobProgressRenderer`) accept colors via constructor and expose `updateColors(colors)`. `World.tsx` subscribes to `useGameColorStore` and calls these on change.
- **MiniMapWidget** subscribes to `useGameColorStore` to regenerate the terrain bitmap when colors change.
- **PaletteTextureManager** subscribes to `useGameColorStore` for palette changes, redraws canvas textures in place, and calls `texture.source.update()` for automatic Pixi re-upload.
- **UI components** consume CSS variables via Tailwind classes. UI color overrides update the CSS variables directly.
