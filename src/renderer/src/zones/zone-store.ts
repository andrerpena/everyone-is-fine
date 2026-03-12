// =============================================================================
// ZONE STORE
// =============================================================================
// Zustand store for managing zone designations (stockpile, growing, dumping).

import { create } from "zustand";
import { createDefaultFilter, type StockpileFilter } from "./stockpile-filter";
import type { ZoneData, ZonePriority, ZoneTileKey, ZoneType } from "./types";

// =============================================================================
// TYPES
// =============================================================================

interface ZoneState {
  /** All zones keyed by ID */
  zones: Map<string, ZoneData>;
  /** Reverse lookup: tile key → zone ID for quick queries */
  tileToZone: Map<ZoneTileKey, string>;
  /** Monotonically increasing counter for zone IDs */
  nextId: number;
}

interface ZoneActions {
  /** Create a new zone and return its ID */
  createZone: (type: ZoneType, name: string, zLevel: number) => string;
  /** Delete a zone by ID */
  deleteZone: (zoneId: string) => void;
  /** Add tiles to an existing zone */
  addTiles: (zoneId: string, tileKeys: ZoneTileKey[]) => void;
  /** Remove tiles from an existing zone */
  removeTiles: (zoneId: string, tileKeys: ZoneTileKey[]) => void;
  /** Get the zone at a specific tile, if any */
  getZoneAtTile: (tileKey: ZoneTileKey) => ZoneData | undefined;
  /** Get all zones */
  getAllZones: () => ZoneData[];
  /** Update the stockpile filter for a zone */
  setStockpileFilter: (zoneId: string, filter: StockpileFilter) => void;
  /** Set the priority for a stockpile zone */
  setZonePriority: (zoneId: string, priority: ZonePriority) => void;
  /** Set the crop type for a growing zone */
  setGrowingZoneCrop: (zoneId: string, cropType: string) => void;
  /** Clear all zones */
  clearAll: () => void;
}

type ZoneStore = ZoneState & ZoneActions;

// =============================================================================
// STORE
// =============================================================================

export const useZoneStore = create<ZoneStore>()((set, get) => ({
  zones: new Map(),
  tileToZone: new Map(),
  nextId: 1,

  createZone: (type, name, zLevel) => {
    const { nextId } = get();
    const id = `zone_${nextId}`;
    const zone: ZoneData = {
      id,
      type,
      name,
      zLevel,
      tiles: new Set(),
      ...(type === "stockpile"
        ? { filter: createDefaultFilter(), priority: 2 as ZonePriority }
        : {}),
      ...(type === "growing" ? { cropType: "potato" as const } : {}),
    };

    set((state) => ({
      zones: new Map(state.zones).set(id, zone),
      nextId: state.nextId + 1,
    }));

    return id;
  },

  deleteZone: (zoneId) => {
    const { zones } = get();
    const zone = zones.get(zoneId);
    if (!zone) return;

    set((state) => {
      const newZones = new Map(state.zones);
      newZones.delete(zoneId);

      const newTileToZone = new Map(state.tileToZone);
      for (const tileKey of zone.tiles) {
        if (newTileToZone.get(tileKey) === zoneId) {
          newTileToZone.delete(tileKey);
        }
      }

      return { zones: newZones, tileToZone: newTileToZone };
    });
  },

  addTiles: (zoneId, tileKeys) => {
    const { zones } = get();
    const zone = zones.get(zoneId);
    if (!zone) return;

    set((state) => {
      const newZones = new Map(state.zones);
      const updatedZone = { ...zone, tiles: new Set(zone.tiles) };
      const newTileToZone = new Map(state.tileToZone);

      for (const key of tileKeys) {
        // Remove tile from any existing zone first
        const existingZoneId = newTileToZone.get(key);
        if (existingZoneId && existingZoneId !== zoneId) {
          const existingZone = newZones.get(existingZoneId);
          if (existingZone) {
            const updatedExisting = {
              ...existingZone,
              tiles: new Set(existingZone.tiles),
            };
            updatedExisting.tiles.delete(key);
            newZones.set(existingZoneId, updatedExisting);
          }
        }

        updatedZone.tiles.add(key);
        newTileToZone.set(key, zoneId);
      }

      newZones.set(zoneId, updatedZone);
      return { zones: newZones, tileToZone: newTileToZone };
    });
  },

  removeTiles: (zoneId, tileKeys) => {
    const { zones } = get();
    const zone = zones.get(zoneId);
    if (!zone) return;

    set((state) => {
      const newZones = new Map(state.zones);
      const updatedZone = { ...zone, tiles: new Set(zone.tiles) };
      const newTileToZone = new Map(state.tileToZone);

      for (const key of tileKeys) {
        updatedZone.tiles.delete(key);
        if (newTileToZone.get(key) === zoneId) {
          newTileToZone.delete(key);
        }
      }

      newZones.set(zoneId, updatedZone);
      return { zones: newZones, tileToZone: newTileToZone };
    });
  },

  getZoneAtTile: (tileKey) => {
    const { tileToZone, zones } = get();
    const zoneId = tileToZone.get(tileKey);
    if (!zoneId) return undefined;
    return zones.get(zoneId);
  },

  getAllZones: () => {
    return Array.from(get().zones.values());
  },

  setStockpileFilter: (zoneId, filter) => {
    const { zones } = get();
    const zone = zones.get(zoneId);
    if (!zone || zone.type !== "stockpile") return;

    set((state) => {
      const newZones = new Map(state.zones);
      newZones.set(zoneId, { ...zone, filter });
      return { zones: newZones };
    });
  },

  setZonePriority: (zoneId, priority) => {
    const { zones } = get();
    const zone = zones.get(zoneId);
    if (!zone || zone.type !== "stockpile") return;

    set((state) => {
      const newZones = new Map(state.zones);
      newZones.set(zoneId, { ...zone, priority });
      return { zones: newZones };
    });
  },

  setGrowingZoneCrop: (zoneId, cropType) => {
    const { zones } = get();
    const zone = zones.get(zoneId);
    if (!zone || zone.type !== "growing") return;

    set((state) => {
      const newZones = new Map(state.zones);
      newZones.set(zoneId, {
        ...zone,
        cropType: cropType as ZoneData["cropType"],
      });
      return { zones: newZones };
    });
  },

  clearAll: () => {
    set({ zones: new Map(), tileToZone: new Map(), nextId: 1 });
  },
}));
