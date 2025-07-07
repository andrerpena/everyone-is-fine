## Why

The codebase has 7 Zustand stores scattered across 5 different directories (`game-state/`, `config/`, `theming/`, `components/widgets/`, `layers/`, `lib/`). Since all stores represent global state, they should live in a single centralized location for discoverability, consistency, and clear ownership.

Currently a developer must know *which feature directory* a store lives in to find it. Centralizing into `src/renderer/src/stores/` makes all global state immediately discoverable and establishes a consistent pattern for future stores.

## What Changes

- Create `src/renderer/src/stores/` as the single home for all Zustand stores
- Move each store and its companion files (types, hooks, schemas, defaults) into a subdirectory under `stores/`
- Remove or hollow out the original directories (`game-state/`, `config/`, `layers/`, `theming/`) — non-store files that remain (e.g. `theming/theme.ts`, `theming/runtime-theme-generator.ts`) stay in their original locations
- Rename `game-state/store.ts` → `stores/game/game-store.ts` for naming consistency
- Add a top-level `stores/index.ts` barrel export for convenient imports
- Update all import paths across the codebase (~50+ files)

### Target structure

```
src/renderer/src/stores/
  game/
    game-store.ts          (from game-state/store.ts, renamed)
    types.ts               (from game-state/types.ts)
    utils.ts               (from game-state/utils.ts)
    hooks/
      useSimulation.ts     (from game-state/hooks/)
      useSelection.ts
      useWorld.ts
      useInteraction.ts
    index.ts
  config/
    config-store.ts        (from config/config-store.ts)
    config-schema.ts       (from config/config-schema.ts)
    defaults.ts            (from config/defaults.ts)
    types.ts               (from config/types.ts)
    layout-types.ts        (from config/layout-types.ts)
    registry-ids.ts        (from config/registry-ids.ts)
    use-config.ts          (from config/use-config.ts)
    use-layout-config.ts   (from config/use-layout-config.ts)
    index.ts
  layers/
    layer-store.ts         (from layers/layer-store.ts)
    layer-registry.ts      (from layers/layer-registry.ts)
    layer-definitions.ts   (from layers/layer-definitions.ts)
    types.ts               (from layers/types.ts)
    color-scales.ts        (from layers/color-scales.ts)
    index.ts
  colors/
    game-color-store.ts    (from theming/game-color-store.ts)
    default-game-colors.ts (from theming/default-game-colors.ts)
    index.ts
  widgets/
    widget-layout-store.ts (from components/widgets/widget-layout-store.ts)
    types.ts               (from components/widgets/types.ts)
    widget-registry.ts     (from components/widgets/widget-registry.ts)
    register-widgets.ts    (from components/widgets/register-widgets.ts)
    index.ts
  performance/
    performance-store.ts   (from lib/performance-store.ts)
    index.ts
  logs/
    log-store.ts           (from lib/log-store.ts)
    index.ts
  index.ts                 (re-exports all stores)
```

## Capabilities

### New Capabilities
- `centralized-stores`: The `stores/` directory structure, barrel exports, and import conventions for all Zustand global state.

### Modified Capabilities
(none — no existing specs to modify)

## Impact

- **Code**: ~50+ files need import path updates across `components/`, `commands/`, `context/`, `interaction/`, `screens/`, `simulation/`
- **Directories removed**: `game-state/` fully absorbed into `stores/game/`. `config/` fully absorbed into `stores/config/`. `layers/` fully absorbed into `stores/layers/`
- **Directories partially hollowed**: `theming/` keeps non-store files (`theme.ts`, `runtime-theme-generator.ts`, `themes/`, `color-utils.ts`). `components/widgets/` keeps UI components, only store-related files move. `lib/` keeps non-store files (`logger.ts`, `palette-texture-manager.ts`, `viewport-simple/`)
- **Dependencies**: None changed
- **Breaking**: None — internal refactoring only, all imports updated
