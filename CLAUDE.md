# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EveryoneIsFine is a Colony Simulator game akin to RimWorld and Dwarf Fortress.
EveryoneIsFine is an AI-first game. Meaning, it's supposed to be programmed by agents and completely playable by agents.

## Essential Commands

### Development
```bash
npm run dev              # Start Electron app with hot-reload
npm run storybook        # Run Storybook for component development
```

### Build & Production
```bash
npm run build            # Typecheck and build for production
npm run start            # Preview production build in Electron
npm run build:mac        # Build distributable for macOS
npm run build:win        # Build distributable for Windows
npm run build:linux      # Build distributable for Linux
```

### Code Quality
```bash
npm run lint             # Run Biome linter
npm run lint:fix         # Run Biome with auto-fix
npm run typecheck        # Run TypeScript type checking
npm run format           # Format code with Biome
```

## IMPORTANT: Code Quality Checks
**After making any code changes, ALWAYS run:**
```bash
npm run typecheck        # Ensure TypeScript types are correct
npm run lint:fix         # Fix linting and formatting issues
```
These commands must pass before considering any task complete.

## Architecture

### Electron Application
The application is an Electron desktop app with the following structure:

- **Main process** (`src/main/`): Electron app lifecycle, window management, IPC handlers
- **Preload** (`src/preload/`): Bridge between main and renderer, exposes typed APIs via contextBridge
- **Renderer** (`src/renderer/src/`): React application with UI components
- **Storage**: IndexedDB + localStorage (migrating to filesystem in future)

### Key Components

**Docking System** (`src/renderer/src/components/dock/`):
- `DockSystem.tsx`: Main container managing the layout with six panel slots (leftTop, leftBottom, center, centerBottom, rightTop, rightBottom)
- `ResizeHandle.tsx`: Draggable handles for resizing panels
- Uses CSS Grid for layout with configurable column/row sizes stored in CSS variables

**Layout System** (`src/renderer/src/components/layout/`):
- Panel-based architecture with widgets that can be placed in dock slots
- Widget registry pattern in `widgets/widget-map.ts`
- Demo panels showing integration examples

**Component Library** (`src/renderer/src/components/`):
- Tab system with drag-and-drop support via Atlaskit Pragmatic DnD
- Monaco Editor integration for code editing
- Pixi.js integration for graphics rendering

### Technology Stack
- **Framework**: React 19
- **Desktop**: Electron (electron-vite for build, electron-builder for packaging)
- **Build Tool**: Vite (via electron-vite)
- **Language**: TypeScript
- **Styling**: CSS Modules + Tailwind CSS v4
- **UI Components**: Custom components with Storybook
- **Editor**: Monaco Editor
- **Graphics**: Pixi.js
- **Drag & Drop**: @atlaskit/pragmatic-drag-and-drop
- **AI Integration**: Multiple providers (Anthropic, OpenAI, Google, OpenRouter)

### Path Aliases
- `@renderer`: Maps to `src/renderer/src/`

### Configuration Files
- `electron.vite.config.ts`: Electron-Vite build configuration (main, preload, renderer)
- `electron-builder.yml`: Electron packaging/distribution configuration
- `tsconfig.json`: Base TypeScript configuration
- `tsconfig.node.json`: TypeScript config for main + preload (Node.js target)
- `tsconfig.web.json`: TypeScript config for renderer (browser target)
- `biome.json`: Biome linter/formatter configuration

### Spec Files (`.spec/`)
- `.spec/north-star.md`: Project vision and long-term direction
- `.spec/roadmap.md`: 295-item prioritized roadmap (product wish list, not strict orders)
- `.spec/guiding-principles.md`: Development rules and principles for autonomous agents
- `.spec/docs/`: Game design documentation and technical specs
- `.spec/tickets/pending/`: Current work tickets awaiting implementation
- `.spec/tickets/completed/`: Finished tickets (historical reference)
- `.spec/human-requests/todo.md`: Human requests (## TODO / ## DONE sections)
