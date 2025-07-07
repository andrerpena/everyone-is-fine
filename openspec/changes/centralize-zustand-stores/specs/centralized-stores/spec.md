## ADDED Requirements

### Requirement: All Zustand stores live under stores/ directory
All Zustand store files and their companion files (types, hooks, schemas, defaults, registries) SHALL reside under `src/renderer/src/stores/`. Each store domain SHALL have its own subdirectory.

#### Scenario: Developer looks for a Zustand store
- **WHEN** a developer needs to find or create a Zustand store
- **THEN** all stores are located under `src/renderer/src/stores/` in domain-specific subdirectories

#### Scenario: New store is added to the project
- **WHEN** a developer creates a new Zustand store
- **THEN** they create a new subdirectory under `stores/` with the store file, types, and an `index.ts` barrel export

### Requirement: Store subdirectory structure
Each store domain SHALL have a subdirectory containing at minimum a store file named `<domain>-store.ts` and an `index.ts` barrel export. The required subdirectories are: `game/`, `config/`, `layers/`, `colors/`, `widgets/`, `performance/`, `logs/`.

#### Scenario: game subdirectory contents
- **WHEN** inspecting `stores/game/`
- **THEN** it contains `game-store.ts`, `types.ts`, `utils.ts`, `index.ts`, and a `hooks/` subdirectory with `useSimulation.ts`, `useSelection.ts`, `useWorld.ts`, `useInteraction.ts`

#### Scenario: config subdirectory contents
- **WHEN** inspecting `stores/config/`
- **THEN** it contains `config-store.ts`, `config-schema.ts`, `defaults.ts`, `types.ts`, `layout-types.ts`, `registry-ids.ts`, `use-config.ts`, `use-layout-config.ts`, `index.ts`

#### Scenario: layers subdirectory contents
- **WHEN** inspecting `stores/layers/`
- **THEN** it contains `layer-store.ts`, `layer-registry.ts`, `layer-definitions.ts`, `types.ts`, `color-scales.ts`, `index.ts`

#### Scenario: colors subdirectory contents
- **WHEN** inspecting `stores/colors/`
- **THEN** it contains `game-color-store.ts`, `default-game-colors.ts`, `index.ts`

#### Scenario: widgets subdirectory contents
- **WHEN** inspecting `stores/widgets/`
- **THEN** it contains `widget-layout-store.ts`, `types.ts`, `widget-registry.ts`, `register-widgets.ts`, `index.ts`

#### Scenario: performance subdirectory contents
- **WHEN** inspecting `stores/performance/`
- **THEN** it contains `performance-store.ts`, `index.ts`

#### Scenario: logs subdirectory contents
- **WHEN** inspecting `stores/logs/`
- **THEN** it contains `log-store.ts`, `index.ts`

### Requirement: Top-level barrel export
`stores/index.ts` SHALL re-export the public API from all store subdirectories. Consumers SHALL be able to import from either `@renderer/stores` or `@renderer/stores/<domain>`.

#### Scenario: Import from top-level barrel
- **WHEN** a consumer imports `import { useGameStore } from '@renderer/stores'`
- **THEN** the import resolves to the game store from `stores/game/`

#### Scenario: Import from specific subdirectory
- **WHEN** a consumer imports `import { useGameStore } from '@renderer/stores/game'`
- **THEN** the import resolves to the same game store

### Requirement: Store file naming convention
All store files SHALL follow the `<domain>-store.ts` naming pattern. The game store SHALL be renamed from `store.ts` to `game-store.ts`.

#### Scenario: Consistent naming across all stores
- **WHEN** listing all store files in `stores/`
- **THEN** every store file matches the pattern `*-store.ts` (game-store, config-store, layer-store, game-color-store, widget-layout-store, performance-store, log-store)

### Requirement: Original directories cleaned up
Directories that are fully absorbed SHALL be removed. Directories that are partially hollowed SHALL retain only non-store files.

#### Scenario: Fully absorbed directories removed
- **WHEN** migration is complete
- **THEN** `src/renderer/src/game-state/`, `src/renderer/src/config/`, and `src/renderer/src/layers/` no longer exist

#### Scenario: theming directory retains non-store files
- **WHEN** migration is complete
- **THEN** `src/renderer/src/theming/` still exists and contains `color-utils.ts`, `runtime-theme-generator.ts`, and the `themes/` subdirectory, but NOT `game-color-store.ts`, `default-game-colors.ts`, or theme type definitions

#### Scenario: components/widgets retains UI components
- **WHEN** migration is complete
- **THEN** `src/renderer/src/components/widgets/` still exists with all UI components (WidgetSlot.tsx, WidgetTabContextMenu.tsx, SlotAddWidgetMenu.tsx, WidgetModalActions.tsx, definitions/) but NOT widget-layout-store.ts, widget-registry.ts, register-widgets.ts, or types.ts

#### Scenario: lib retains utilities
- **WHEN** migration is complete
- **THEN** `src/renderer/src/lib/` still exists with `logger.ts`, `palette-texture-manager.ts`, and `viewport-simple/` but NOT `log-store.ts` or `performance-store.ts`

### Requirement: All import paths updated
Every file that previously imported from the old store locations SHALL be updated to import from the new `@renderer/stores/...` paths. No re-export shims SHALL exist in old locations.

#### Scenario: No broken imports after migration
- **WHEN** running `npm run typecheck`
- **THEN** all TypeScript type checks pass with zero errors related to missing modules or imports

#### Scenario: No references to old paths
- **WHEN** searching the codebase for imports from `@renderer/game-state`, `@renderer/config`, `@renderer/layers`
- **THEN** zero results are found (all updated to `@renderer/stores/...`)

### Requirement: Store behavior unchanged
All stores SHALL maintain their existing state shape, actions, hooks, and public API after migration. This is a structural refactor only.

#### Scenario: Application functions normally after migration
- **WHEN** the application starts after migration
- **THEN** all stores initialize correctly, all UI components render, and all game functionality works identically to before the migration
