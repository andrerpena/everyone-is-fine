import { create } from "zustand";
import { layerRegistry } from "./layer-registry";
import type { LayerVisibilityMap } from "./types";

// =============================================================================
// TYPES
// =============================================================================

interface LayerState {
  /** Layer visibility states */
  visibility: LayerVisibilityMap;
  /** Whether the store has been initialized */
  isInitialized: boolean;
}

interface LayerActions {
  /** Initialize with registry defaults */
  initialize: () => void;
  /** Set a layer's visibility */
  setLayerVisible: (layerId: string, visible: boolean) => void;
  /** Toggle a layer's visibility */
  toggleLayer: (layerId: string) => void;
  /** Set multiple layers' visibility at once */
  setLayersVisible: (layerIds: string[], visible: boolean) => void;
  /** Reset to registry defaults */
  resetToDefaults: () => void;
}

type LayerStore = LayerState & LayerActions;

// =============================================================================
// STORE
// =============================================================================

export const useLayerStore = create<LayerStore>()((set, get) => ({
  visibility: new Map(),
  isInitialized: false,

  initialize: () => {
    const { isInitialized } = get();
    if (isInitialized) return;

    set({
      visibility: layerRegistry.getDefaultVisibility(),
      isInitialized: true,
    });
  },

  setLayerVisible: (layerId, visible) => {
    set((state) => {
      const newVisibility = new Map(state.visibility);
      newVisibility.set(layerId, visible);
      return { visibility: newVisibility };
    });
  },

  toggleLayer: (layerId) => {
    const current = get().visibility.get(layerId) ?? false;
    get().setLayerVisible(layerId, !current);
  },

  setLayersVisible: (layerIds, visible) => {
    set((state) => {
      const newVisibility = new Map(state.visibility);
      for (const id of layerIds) {
        newVisibility.set(id, visible);
      }
      return { visibility: newVisibility };
    });
  },

  resetToDefaults: () => {
    set({
      visibility: layerRegistry.getDefaultVisibility(),
      isInitialized: true,
    });
  },
}));

// =============================================================================
// SELECTOR HOOKS
// =============================================================================

/**
 * Hook to get visibility state for a specific layer
 */
export const useLayerVisibility = (layerId: string): boolean => {
  return useLayerStore((state) => state.visibility.get(layerId) ?? false);
};

/**
 * Hook to get all enabled layer IDs
 */
export const useEnabledLayers = (): string[] => {
  return useLayerStore((state) => {
    const enabled: string[] = [];
    for (const [id, visible] of state.visibility) {
      if (visible) enabled.push(id);
    }
    return enabled;
  });
};

/**
 * Hook to get visibility map for rendering
 */
export const useLayerVisibilityMap = (): LayerVisibilityMap => {
  return useLayerStore((state) => state.visibility);
};
