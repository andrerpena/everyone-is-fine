# Electron Transition Design

## Goal

Convert EveryoneIsFine from a pure web app (Vite + React, deployed to Cloudflare Pages) to an Electron-only desktop application using `electron-vite` and `electron-builder`. This enables full local filesystem access, similar to VS Code.

## Project Structure

### New directory layout

```
src/
  main/              # Electron main process (NEW)
    index.ts          # App lifecycle, BrowserWindow creation
  preload/            # Preload scripts (NEW)
    index.ts          # contextBridge exposing IPC APIs to renderer
    index.d.ts        # Type declarations for exposed APIs
  renderer/           # Existing React app (UNCHANGED structure)
    index.html
    src/
      ...existing code...
  lib/                # Shared utilities (KEEP)
  shared/             # Shared types (KEEP)
```

### Deleted

- `src/cli/` — replaced by Electron
- `wrangler.jsonc` — Cloudflare deployment no longer needed
- `vite.config.ts` — replaced by `electron.vite.config.ts`

## Tooling

### Dependencies to add

- `electron` (dev) — latest stable
- `electron-vite` (dev) — latest, Vite-based build tool for Electron
- `electron-builder` (dev) — packaging and distribution
- `@electron-toolkit/preload` (dev) — preload utilities (contextBridge helpers)
- `@electron-toolkit/utils` (runtime) — main process utilities

### Dependencies to remove

- `vite-plugin-pwa` — no service workers in Electron
- `vite-plugin-static-copy` — electron-vite handles static assets differently

## Configuration Files

### `electron.vite.config.ts`

Replaces `vite.config.ts`. Configures three Vite builds:

- **main**: Targets Node.js, entry `src/main/index.ts`, outputs to `out/main`
- **preload**: Targets Node.js, entry `src/preload/index.ts`, outputs to `out/preload`
- **renderer**: Targets browser, entry `src/renderer/index.html`, outputs to `out/renderer`. Carries over existing config: `@renderer` alias, CSS Modules with camelCase, Tailwind via PostCSS, React plugin, Monaco/Pixi chunking

### `electron-builder.yml`

Top-level config for packaging:

- `appId`: `com.everyoneisfine.app`
- `productName`: `Everyone is fine`
- `directories.output`: `release`
- `files`: `out/**/*`
- Mac: `dmg` + `zip` targets
- Windows: `nsis` target
- Linux: `AppImage` + `deb` targets

### TypeScript configs

- `tsconfig.json` — base config with shared `compilerOptions`
- `tsconfig.node.json` — extends base, for main + preload (`"module": "esnext"`, `"target": "esnext"`, includes `src/main`, `src/preload`)
- `tsconfig.web.json` — extends base, for renderer (keeps current DOM libs, JSX, paths)

### `package.json` changes

- `"main": "./out/main/index.js"` — Electron entry point
- Updated scripts:
  - `"dev": "electron-vite dev"` — dev server with HMR
  - `"build": "npm run typecheck && electron-vite build"` — production build
  - `"start": "electron-vite preview"` — preview production build
  - `"postinstall": "electron-builder install-app-deps"` — native module support
  - `"build:mac": "electron-vite build && electron-builder --mac"`
  - `"build:win": "electron-vite build && electron-builder --win"`
  - `"build:linux": "electron-vite build && electron-builder --linux"`
- Remove `"cli"` script
- Remove `"homepage"` (no longer a web app)
- Keep `storybook`, `typecheck`, `lint`, `lint:fix`, `format` scripts unchanged

## Main Process (`src/main/index.ts`)

Responsibilities:
- Create the main `BrowserWindow` with appropriate settings
- Load the renderer (dev server URL in dev, file path in production)
- Handle app lifecycle events (`ready`, `window-all-closed`, `activate`)
- Set up IPC handlers for filesystem operations

Key settings:
- `webPreferences.preload` pointing to preload script
- `webPreferences.sandbox: false` for Node.js integration in preload
- Window size, title, icon configuration

## Preload Script (`src/preload/index.ts`)

Exposes a typed API to the renderer via `contextBridge.exposeInMainWorld`:

```typescript
// Initial minimal API — expanded as needed
electronAPI: {
  // Filesystem
  readFile(path: string): Promise<string>
  writeFile(path: string, data: string): Promise<void>
  readDir(path: string): Promise<string[]>
  exists(path: string): Promise<boolean>
  mkdir(path: string): Promise<void>

  // Dialog
  showOpenDialog(options): Promise<string[]>
  showSaveDialog(options): Promise<string | undefined>

  // App info
  getAppVersion(): string
  getPlatform(): string
}
```

Type declarations in `src/preload/index.d.ts` so the renderer gets full TypeScript support.

## Renderer Changes

Minimal changes required:
- Remove PWA/service worker registration code (if any explicit references exist)
- Existing IndexedDB + localStorage storage continues to work initially
- Future: migrate storage to filesystem via the preload API (out of scope for this transition)

## Storybook

Continues to work independently — it has its own Vite config and doesn't need Electron. No changes needed.

## What This Design Does NOT Cover

- Migrating existing IndexedDB/localStorage data to filesystem (future work)
- Auto-update mechanism (can add later via `electron-updater`)
- Code signing for distribution
- Platform-specific integrations (system tray, native menus beyond basics)
