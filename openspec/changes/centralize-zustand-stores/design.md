## Context

The codebase has 7 Zustand stores distributed across 5 directories. All represent global state but are co-located with feature code, making them hard to discover as a group. The proposal establishes `src/renderer/src/stores/` as the single centralized location, with each store getting its own subdirectory containing the store, types, hooks, and companion files.

Current store locations and their cross-directory consumer counts:
- `game-state/store.ts` — 19 external consumers (largest store, 629 lines, has hooks layer)
- `config/config-store.ts` — 21 external consumers (9 companion files including schemas, hooks, defaults)
- `layers/layer-store.ts` — 8 external consumers (has registry, definitions, color scales)
- `theming/game-color-store.ts` — 7 external consumers (mixed directory: store + non-store files)
- `components/widgets/widget-layout-store.ts` — 7 external consumers (mixed directory: store + UI components)
- `lib/performance-store.ts` — 4 external consumers (mixed directory: store + utilities)
- `lib/log-store.ts` — 3 external consumers (mixed directory: store + utilities)

Two cross-store dependencies exist:
1. `layers/color-scales.ts` imports `useGameColorStore` from `theming/`
2. `widget-layout-store.ts` imports `useConfigStore` from `config/`

No circular dependencies exist between stores.

## Goals / Non-Goals

**Goals:**
- Single `stores/` directory containing all Zustand stores and their companion files
- Consistent subdirectory structure per store domain
- All import paths updated — no broken references
- TypeScript typecheck and lint pass after migration
- Preserve existing public API surface (same hooks, same store names)

**Non-Goals:**
- Refactoring store internals (state shape, actions, middleware)
- Merging stores or introducing the slices pattern
- Changing how stores are consumed (hooks vs `getState()`)
- Modifying `context/ColonyContext.tsx` orchestration layer beyond import updates
- Moving non-store files out of their current locations (e.g. `theming/themes/`, `lib/logger.ts`)

## Decisions

### 1. Subdirectory-per-domain structure (not flat files)

Each store domain gets its own subdirectory with an `index.ts` barrel export. This keeps related files grouped and avoids a flat directory with 30+ files.

**Chosen:**
```
stores/game/game-store.ts
stores/game/types.ts
stores/game/hooks/useSimulation.ts
stores/game/index.ts
```

**Alternative rejected — flat with dot-separated naming:**
```
stores/game-store.ts
stores/game-store.types.ts
stores/game-store.hooks.useSimulation.ts
```
Rejected because: harder to scan, no grouping, unusual naming convention.

### 2. Three directories fully absorbed, three partially hollowed

**Fully absorbed** (directory removed after migration):
- `game-state/` → `stores/game/` — all 8 files move (store, types, utils, 4 hooks, index)
- `config/` → `stores/config/` — all 9 files move (store, schema, defaults, types, layout-types, registry-ids, 2 hook files, index)
- `layers/` → `stores/layers/` — all 6 files move (store, types, registry, definitions, color-scales, index)

**Partially hollowed** (non-store files stay):
- `theming/` — 3 files move (game-color-store, default-game-colors, theme types), 6 stay (color-utils, runtime-theme-generator, themes/)
- `components/widgets/` — 4 files move (widget-layout-store, types, widget-registry, register-widgets), all UI components stay
- `lib/` — 2 files move (log-store, performance-store), utilities stay (logger, palette-texture-manager, viewport-simple/)

### 3. Handling the shared `components/widgets/types.ts`

The current `types.ts` in `components/widgets/` contains both store-related types (WidgetSlotId, WidgetDefinition, WidgetLayoutConfig) and is imported by both the store and UI components.

**Approach:** Move the entire `types.ts` to `stores/widgets/types.ts`. UI components in `components/widgets/` update their imports to point at the new location. No split needed — the types are fundamentally store types that UI components consume.

### 4. Import path strategy

All consumers update their imports to use the new `@renderer/stores/...` paths. No re-export shims in old locations — clean break.

**Rationale:** Re-export shims create confusion about the canonical import path and add maintenance burden. Since this is a single-commit refactor, all paths update at once.

### 5. Barrel export structure

Each subdirectory gets an `index.ts` exporting its public API. The top-level `stores/index.ts` re-exports from all subdirectories for convenience, but consumers can also import from specific subdirectories for clarity.

```typescript
// Both work:
import { useGameStore } from '@renderer/stores'
import { useGameStore } from '@renderer/stores/game'
```

### 6. Store file naming convention

All store files use the `<domain>-store.ts` pattern:
- `game-store.ts` (renamed from `store.ts`)
- `config-store.ts` (unchanged)
- `layer-store.ts` (unchanged)
- `game-color-store.ts` (unchanged)
- `widget-layout-store.ts` (unchanged)
- `performance-store.ts` (unchanged)
- `log-store.ts` (unchanged)

### 7. Migration order

Stores are migrated in dependency order to avoid intermediate broken states:
1. `logs/` and `performance/` — zero dependencies on other stores
2. `config/` — no store dependencies (only imports from `lib/logger` and `services/storage`)
3. `colors/` — no store dependencies
4. `layers/` — depends on `colors/` (color-scales imports game-color-store)
5. `widgets/` — depends on `config/` (widget-layout-store imports config-store)
6. `game/` — no store dependencies, but largest surface area so done last

## Risks / Trade-offs

**Large number of import updates (~50-60 files)** → Mitigated by doing all changes in a single commit. TypeScript compiler will catch any missed imports immediately.

**Hollowed directories may confuse** → `theming/` losing its store but keeping utilities could be surprising. Mitigated by the remaining files being clearly non-store (themes, utilities, runtime generator).

**`register-widgets.ts` imports widget definitions from `components/widgets/definitions/`** → After moving to `stores/widgets/`, this file will import from outside `stores/`. This is acceptable — registration logic needs to reference the actual UI components it registers.

**`config/layout-types.ts` has type imports from `components/`** → This creates an import from `stores/` back to `components/`. Acceptable because these are TypeScript type-only imports (erased at runtime), not runtime dependencies.
