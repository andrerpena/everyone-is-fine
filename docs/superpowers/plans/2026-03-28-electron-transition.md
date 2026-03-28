# Electron Transition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the EveryoneIsFine web app to an Electron-only desktop app using electron-vite and electron-builder, enabling full local filesystem access.

**Architecture:** Three-process Electron architecture (main, preload, renderer) built with electron-vite. The renderer is the existing React app with minimal changes. Main process handles window lifecycle and IPC. Preload exposes typed filesystem APIs via contextBridge.

**Tech Stack:** Electron 41, electron-vite 5, electron-builder 26, React 19, Vite 6, TypeScript

---

### Task 1: Remove web-only files and dependencies

**Files:**
- Delete: `src/cli/` (entire directory)
- Delete: `wrangler.jsonc`
- Delete: `src/renderer/public/manifest.json`
- Delete: `src/renderer/public/apple-touch-icon-180x180.png`
- Delete: `src/renderer/public/icon-192x192.png`
- Delete: `src/renderer/public/icon-512x512.png`
- Modify: `src/renderer/index.html`
- Modify: `package.json`

- [ ] **Step 1: Delete the CLI directory**

```bash
rm -rf src/cli/
```

- [ ] **Step 2: Delete Cloudflare deployment config**

```bash
rm wrangler.jsonc
```

- [ ] **Step 3: Delete PWA assets**

```bash
rm src/renderer/public/manifest.json
rm src/renderer/public/apple-touch-icon-180x180.png
rm src/renderer/public/icon-192x192.png
rm src/renderer/public/icon-512x512.png
```

- [ ] **Step 4: Clean up `index.html` — remove PWA meta tags and manifest link**

Remove the PWA-specific lines from `src/renderer/index.html`. The file should become:

```html
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Everyone is fine</title>
    <!-- https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP -->
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' http: https:; worker-src 'self' blob:;"
    />
  </head>

  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Note: The CSP is tightened — removed `https: http:` from `default-src` since Electron loads locally. Kept `connect-src 'self' http: https:` because the app calls external AI APIs.

- [ ] **Step 5: Remove web-only dependencies from `package.json`**

Remove from `devDependencies`:
- `vite-plugin-pwa`
- `vite-plugin-static-copy`

Remove from `scripts`:
- `"cli"` script

Remove the `"homepage"` field.

Run:
```bash
npm uninstall vite-plugin-pwa vite-plugin-static-copy
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove web-only files, PWA assets, CLI, and Cloudflare config"
```

---

### Task 2: Install Electron dependencies and add package.json entry point

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Electron, electron-vite, and electron-builder**

```bash
npm install -D electron electron-vite electron-builder @electron-toolkit/preload @electron-toolkit/utils
```

- [ ] **Step 2: Update `package.json` — add `main` field and update scripts**

Add the `"main"` field at the top level:

```json
"main": "./out/main/index.js",
```

Replace the `scripts` section with:

```json
"scripts": {
  "dev": "electron-vite dev",
  "build": "npm run typecheck && electron-vite build",
  "start": "electron-vite preview",
  "preview": "electron-vite preview",
  "postinstall": "electron-builder install-app-deps",
  "build:mac": "electron-vite build && electron-builder --mac",
  "build:win": "electron-vite build && electron-builder --win",
  "build:linux": "electron-vite build && electron-builder --linux",
  "typecheck": "tsc --noEmit -p tsconfig.node.json && tsc --noEmit -p tsconfig.web.json",
  "lint": "biome check .",
  "lint:fix": "biome check --write .",
  "format": "biome format --write .",
  "storybook": "storybook dev -p 6006",
  "build-storybook": "storybook build"
}
```

- [ ] **Step 3: Update `.gitignore` — add Electron output directories**

Append to `.gitignore`:

```
# Electron
out/
release/
```

- [ ] **Step 4: Update `biome.json` — ignore Electron output directories**

Add `!**/out` and `!**/release` to the `files.includes` array in `biome.json`.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .gitignore biome.json
git commit -m "chore: install Electron dependencies and update scripts"
```

---

### Task 3: Create TypeScript configurations

**Files:**
- Modify: `tsconfig.json` (becomes base config)
- Create: `tsconfig.node.json` (main + preload)
- Create: `tsconfig.web.json` (renderer)

- [ ] **Step 1: Rewrite `tsconfig.json` as the base config**

```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "esnext",
    "strict": true,
    "esModuleInterop": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitAny": false,
    "noImplicitReturns": true
  },
  "references": [
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.web.json" }
  ]
}
```

- [ ] **Step 2: Create `tsconfig.node.json` for main + preload**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "lib": ["ESNext"],
    "outDir": "./out",
    "types": ["node"]
  },
  "include": [
    "src/main/**/*",
    "src/preload/**/*",
    "electron.vite.config.ts"
  ]
}
```

- [ ] **Step 3: Create `tsconfig.web.json` for renderer**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "outDir": "./out",
    "baseUrl": ".",
    "paths": {
      "@renderer/*": ["src/renderer/src/*"]
    }
  },
  "include": [
    "src/renderer/src/env.d.ts",
    "src/renderer/src/**/*",
    "src/renderer/src/**/*.tsx"
  ]
}
```

- [ ] **Step 4: Commit**

```bash
git add tsconfig.json tsconfig.node.json tsconfig.web.json
git commit -m "chore: split tsconfig into base, node, and web configs"
```

---

### Task 4: Create the electron-vite config

**Files:**
- Create: `electron.vite.config.ts`
- Delete: `vite.config.ts`

- [ ] **Step 1: Create `electron.vite.config.ts`**

```typescript
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/postcss";
import react from "@vitejs/plugin-react";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import pkg from "./package.json";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: "out/main",
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: "out/preload",
    },
  },
  renderer: {
    root: "src/renderer",
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    resolve: {
      alias: {
        "@renderer": resolve(__dirname, "src/renderer/src"),
      },
    },
    css: {
      modules: {
        localsConvention: "camelCase",
      },
      postcss: {
        plugins: [tailwindcss()],
      },
    },
    plugins: [react()],
    build: {
      outDir: "out/renderer",
      rollupOptions: {
        output: {
          manualChunks: {
            "monaco-editor": ["monaco-editor", "@monaco-editor/loader"],
            pixi: ["pixi.js"],
            "react-vendor": ["react", "react-dom"],
          },
        },
      },
    },
  },
});
```

- [ ] **Step 2: Delete the old `vite.config.ts`**

```bash
rm vite.config.ts
```

- [ ] **Step 3: Commit**

```bash
git add electron.vite.config.ts
git rm vite.config.ts
git commit -m "chore: replace vite.config.ts with electron.vite.config.ts"
```

---

### Task 5: Create the main process

**Files:**
- Create: `src/main/index.ts`

- [ ] **Step 1: Create `src/main/index.ts`**

```typescript
import { join } from "node:path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import { BrowserWindow, app, shell } from "electron";

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // HMR for renderer in development, file load in production
  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  // Set app user model id for Windows
  electronApp.setAutoLaunch(false);

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();

  app.on("activate", () => {
    // On macOS re-create a window when dock icon is clicked and no windows open
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add src/main/index.ts
git commit -m "feat: add Electron main process"
```

---

### Task 6: Create the preload script

**Files:**
- Create: `src/preload/index.ts`
- Create: `src/preload/index.d.ts`
- Modify: `src/renderer/src/env.d.ts`

- [ ] **Step 1: Create `src/preload/index.ts`**

```typescript
import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

// Expose electron APIs to the renderer process.
// In the renderer, access via `window.electron` and `window.api`.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", {});
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = electronAPI;
  window.api = {};
}
```

- [ ] **Step 2: Create `src/preload/index.d.ts`**

```typescript
import type { ElectronAPI } from "@electron-toolkit/preload";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: Record<string, unknown>;
  }
}
```

- [ ] **Step 3: Update `src/renderer/src/env.d.ts` to include preload types**

Replace the contents with:

```typescript
/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
```

No changes needed here — the preload types are picked up from `src/preload/index.d.ts` via the tsconfig references. The `env.d.ts` stays as-is.

- [ ] **Step 4: Commit**

```bash
git add src/preload/index.ts src/preload/index.d.ts
git commit -m "feat: add Electron preload script with contextBridge"
```

---

### Task 7: Create electron-builder config

**Files:**
- Create: `electron-builder.yml`

- [ ] **Step 1: Create `electron-builder.yml`**

```yaml
appId: com.everyoneisfine.app
productName: Everyone is fine
directories:
  buildResources: build
  output: release
files:
  - out/**/*
  - "!out/renderer/src/**"
extraMetadata:
  main: ./out/main/index.js
mac:
  artifactName: ${name}-${version}-${arch}.${ext}
  target:
    - target: dmg
      arch:
        - x64
        - arm64
    - target: zip
      arch:
        - x64
        - arm64
win:
  artifactName: ${name}-${version}-setup.${ext}
  target:
    - target: nsis
      arch:
        - x64
nsis:
  oneClick: false
  perMachine: false
  allowToChangeInstallationDirectory: true
linux:
  artifactName: ${name}-${version}-${arch}.${ext}
  target:
    - target: AppImage
      arch:
        - x64
    - target: deb
      arch:
        - x64
```

- [ ] **Step 2: Create `build/` directory with a placeholder for app icons**

```bash
mkdir -p build
```

Copy the existing icon to `build/icon.png` so electron-builder has something to use:

```bash
cp src/renderer/public/sprites/icon.png build/icon.png 2>/dev/null || echo "No icon found — add build/icon.png later"
```

- [ ] **Step 3: Commit**

```bash
git add electron-builder.yml build/ 2>/dev/null
git commit -m "chore: add electron-builder configuration"
```

---

### Task 8: Handle fonts (replace vite-plugin-static-copy)

**Files:**
- Modify: `src/renderer/index.html` or CSS to reference fonts via the correct path

The old `vite.config.ts` used `vite-plugin-static-copy` to copy fonts from `src/fonts/` (which doesn't exist — the actual fonts are in `src/renderer/src/fonts/`). In electron-vite, the `public/` directory in the renderer root is automatically served. We need to either:
- Move fonts to `src/renderer/public/fonts/` so they're served automatically, or
- Reference them directly from `src/renderer/src/fonts/` via the bundler

- [ ] **Step 1: Check how fonts are currently referenced**

Search for `Source_Code_Pro` references in CSS or other files to understand the current font loading pattern.

- [ ] **Step 2: Move fonts to public if needed, or verify they're imported via CSS**

If fonts are loaded via CSS `@font-face` with a relative path, they'll work through Vite's asset pipeline without the static copy plugin. If they're referenced as `/assets/fonts/...`, move them to `src/renderer/public/fonts/` and update references.

Handle this based on what the search in Step 1 reveals.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "fix: ensure fonts load correctly in electron-vite"
```

---

### Task 9: Verify the app runs in development

- [ ] **Step 1: Run the dev server**

```bash
npm run dev
```

Expected: Electron window opens, showing the app with the same UI as the web version.

- [ ] **Step 2: Fix any issues**

Common issues to watch for:
- Path resolution errors — check `@renderer` alias is working
- CSP violations in the console — adjust the CSP in `index.html`
- Missing environment variables — `ELECTRON_RENDERER_URL` is set automatically by electron-vite
- Font loading issues — addressed in Task 8

- [ ] **Step 3: Run type checking and linting**

```bash
npm run typecheck
npm run lint:fix
```

Both must pass.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve issues from initial Electron dev run"
```

---

### Task 10: Verify production build

- [ ] **Step 1: Build the app**

```bash
npm run build
```

Expected: `out/` directory created with `main/`, `preload/`, and `renderer/` subdirectories.

- [ ] **Step 2: Preview the production build**

```bash
npm run start
```

Expected: Electron window opens with the production build, app is fully functional.

- [ ] **Step 3: Fix any production-specific issues**

Common issues:
- Asset paths not resolving (check `base` config in renderer)
- `__dirname` not available in ESM (electron-vite handles this, but verify)

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve production build issues"
```

---

### Task 11: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update the development commands section**

Update the Essential Commands section to reflect the new Electron commands:

```markdown
### Development
\`\`\`bash
npm run dev              # Start Electron app with hot-reload
npm run storybook        # Run Storybook for component development
\`\`\`

### Build & Production
\`\`\`bash
npm run build            # Typecheck and build for production
npm run start            # Preview production build in Electron
npm run build:mac        # Build distributable for macOS
npm run build:win        # Build distributable for Windows
npm run build:linux      # Build distributable for Linux
\`\`\`
```

- [ ] **Step 2: Update the Architecture section**

Replace "Web Application" with "Electron Application" and update the description:

```markdown
### Electron Application
The application is an Electron desktop app with the following structure:

- **Main process** (`src/main/`): Electron app lifecycle, window management, IPC handlers
- **Preload** (`src/preload/`): Bridge between main and renderer, exposes typed APIs via contextBridge
- **Renderer** (`src/renderer/src/`): React application with UI components
- **Storage**: IndexedDB + localStorage (migrating to filesystem in future)
```

- [ ] **Step 3: Update the Technology Stack section**

Add to the stack list:
```markdown
- **Desktop**: Electron (electron-vite for build, electron-builder for packaging)
```

Remove:
- References to PWA
- References to Cloudflare Pages / Wrangler

- [ ] **Step 4: Update Configuration Files section**

Replace `vite.config.ts` with `electron.vite.config.ts` and add `electron-builder.yml`.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for Electron architecture"
```
