import {
  ChevronDown,
  ChevronRight,
  Filter,
  MapPin,
  Trash2,
} from "lucide-react";
import { useCallback, useState } from "react";
import { ITEM_REGISTRY } from "../../../world/registries/item-registry";
import type { ItemCategory, ItemType } from "../../../world/types";
import {
  ALL_CATEGORIES,
  CATEGORY_ITEMS,
  type StockpileFilter,
} from "../../../zones/stockpile-filter";
import {
  ZONE_PRIORITY_LABELS,
  type ZoneData,
  type ZonePriority,
  type ZoneType,
} from "../../../zones/types";
import { useZoneStore } from "../../../zones/zone-store";
import type { WidgetComponentProps, WidgetDefinition } from "../types";

/** Human-readable labels for zone types */
const ZONE_TYPE_LABELS: Record<ZoneType, string> = {
  stockpile: "Stockpile",
  growing: "Growing",
  dumping: "Dumping",
};

/** Color indicators for zone types */
const ZONE_TYPE_COLORS: Record<ZoneType, string> = {
  stockpile: "bg-yellow-500",
  growing: "bg-green-500",
  dumping: "bg-red-500",
};

/** Priority display colors */
const PRIORITY_COLORS: Record<ZonePriority, string> = {
  1: "text-green-400",
  2: "text-neutral-300",
  3: "text-orange-400",
};

/** Human-readable category labels */
const CATEGORY_LABELS: Record<ItemCategory, string> = {
  resource: "Resources",
  food: "Food",
  weapon: "Weapons",
  apparel: "Apparel",
  medicine: "Medicine",
  tool: "Tools",
  artifact: "Artifacts",
};

function ZonesWidget(_props: WidgetComponentProps) {
  const zones = useZoneStore((s) => s.getAllZones());
  const deleteZone = useZoneStore((s) => s.deleteZone);
  const setZonePriority = useZoneStore((s) => s.setZonePriority);

  const cyclePriority = useCallback(
    (zone: ZoneData) => {
      if (zone.type !== "stockpile") return;
      const current = zone.priority ?? 2;
      const next = ((current % 3) + 1) as ZonePriority;
      setZonePriority(zone.id, next);
    },
    [setZonePriority],
  );

  /** Track which zone's filter panel is open */
  const [filterOpenId, setFilterOpenId] = useState<string | null>(null);

  if (zones.length === 0) {
    return (
      <div className="p-4 text-sm text-neutral-400">
        No zones designated yet.
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-neutral-700">
            <th className="text-left p-1.5 pl-2 font-medium text-neutral-300">
              Type
            </th>
            <th className="text-left p-1.5 font-medium text-neutral-300">
              Name
            </th>
            <th className="text-center p-1.5 font-medium text-neutral-300">
              Tiles
            </th>
            <th className="text-center p-1.5 font-medium text-neutral-300">
              Config
            </th>
            <th className="p-1.5 w-8" />
          </tr>
        </thead>
        <tbody>
          {zones.map((zone) => (
            <ZoneRow
              key={zone.id}
              zone={zone}
              filterOpen={filterOpenId === zone.id}
              onToggleFilter={() =>
                setFilterOpenId((prev) => (prev === zone.id ? null : zone.id))
              }
              onCyclePriority={cyclePriority}
              onDelete={deleteZone}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ZoneRow({
  zone,
  filterOpen,
  onToggleFilter,
  onCyclePriority,
  onDelete,
}: {
  zone: ZoneData;
  filterOpen: boolean;
  onToggleFilter: () => void;
  onCyclePriority: (zone: ZoneData) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <>
      <tr className="border-b border-neutral-800 hover:bg-neutral-800/50">
        <td className="p-1.5 pl-2">
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${ZONE_TYPE_COLORS[zone.type]}`}
            />
            <span className="text-neutral-300">
              {ZONE_TYPE_LABELS[zone.type]}
            </span>
          </span>
        </td>
        <td className="p-1.5 text-neutral-200">{zone.name}</td>
        <td className="p-1.5 text-center text-neutral-400">
          {zone.tiles.size}
        </td>
        <td className="p-1.5 text-center">
          <ZoneConfig
            zone={zone}
            onCyclePriority={onCyclePriority}
            onToggleFilter={onToggleFilter}
            filterOpen={filterOpen}
          />
        </td>
        <td className="p-0.5 text-center">
          <button
            type="button"
            className="p-1 text-neutral-500 hover:text-red-400 cursor-pointer"
            onClick={() => onDelete(zone.id)}
            title={`Delete ${zone.name}`}
          >
            <Trash2 size={12} />
          </button>
        </td>
      </tr>
      {filterOpen && zone.type === "stockpile" && zone.filter && (
        <tr>
          <td colSpan={5} className="p-0">
            <StockpileFilterPanel zoneId={zone.id} filter={zone.filter} />
          </td>
        </tr>
      )}
    </>
  );
}

function ZoneConfig({
  zone,
  onCyclePriority,
  onToggleFilter,
  filterOpen,
}: {
  zone: ZoneData;
  onCyclePriority: (zone: ZoneData) => void;
  onToggleFilter: () => void;
  filterOpen: boolean;
}) {
  if (zone.type === "stockpile") {
    const priority = zone.priority ?? 2;
    return (
      <span className="inline-flex items-center gap-1.5">
        <button
          type="button"
          className={`cursor-pointer hover:underline font-medium ${PRIORITY_COLORS[priority]}`}
          onClick={() => onCyclePriority(zone)}
          title="Click to cycle priority"
        >
          {ZONE_PRIORITY_LABELS[priority]}
        </button>
        <button
          type="button"
          className={`cursor-pointer p-0.5 rounded ${filterOpen ? "text-yellow-400" : "text-neutral-500 hover:text-neutral-300"}`}
          onClick={onToggleFilter}
          title="Toggle item filter"
        >
          <Filter size={11} />
        </button>
      </span>
    );
  }

  if (zone.type === "growing" && zone.cropType) {
    return <span className="text-green-300 capitalize">{zone.cropType}</span>;
  }

  return <span className="text-neutral-500">—</span>;
}

/** Panel showing category checkboxes and per-item toggles for a stockpile */
function StockpileFilterPanel({
  zoneId,
  filter,
}: {
  zoneId: string;
  filter: StockpileFilter;
}) {
  const setStockpileFilter = useZoneStore((s) => s.setStockpileFilter);
  const [expandedCat, setExpandedCat] = useState<ItemCategory | null>(null);

  const toggleCategory = useCallback(
    (category: ItemCategory) => {
      const newAllowed = new Set(filter.allowedCategories);
      if (newAllowed.has(category)) {
        newAllowed.delete(category);
      } else {
        newAllowed.add(category);
      }
      setStockpileFilter(zoneId, {
        allowedCategories: newAllowed,
        disallowedTypes: new Set(filter.disallowedTypes),
      });
    },
    [zoneId, filter, setStockpileFilter],
  );

  const toggleItem = useCallback(
    (itemType: ItemType) => {
      const newDisallowed = new Set(filter.disallowedTypes);
      if (newDisallowed.has(itemType)) {
        newDisallowed.delete(itemType);
      } else {
        newDisallowed.add(itemType);
      }
      setStockpileFilter(zoneId, {
        allowedCategories: new Set(filter.allowedCategories),
        disallowedTypes: newDisallowed,
      });
    },
    [zoneId, filter, setStockpileFilter],
  );

  return (
    <div className="bg-neutral-900/80 border-t border-neutral-700 px-3 py-2 space-y-1">
      <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">
        Item Filter
      </div>
      {ALL_CATEGORIES.map((cat) => {
        const items = CATEGORY_ITEMS.get(cat);
        if (!items || items.size === 0) return null;
        const catEnabled = filter.allowedCategories.has(cat);
        const isExpanded = expandedCat === cat;

        return (
          <div key={cat}>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="text-neutral-500 hover:text-neutral-300 cursor-pointer p-0.5"
                onClick={() => setExpandedCat(isExpanded ? null : cat)}
              >
                {isExpanded ? (
                  <ChevronDown size={10} />
                ) : (
                  <ChevronRight size={10} />
                )}
              </button>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={catEnabled}
                  onChange={() => toggleCategory(cat)}
                  className="accent-yellow-500"
                />
                <span
                  className={
                    catEnabled ? "text-neutral-200" : "text-neutral-500"
                  }
                >
                  {CATEGORY_LABELS[cat]}
                </span>
              </label>
            </div>
            {isExpanded && catEnabled && (
              <div className="ml-6 space-y-0.5 mt-0.5">
                {Array.from(items).map((itemType) => {
                  const excluded = filter.disallowedTypes.has(itemType);
                  const label =
                    ITEM_REGISTRY[itemType as keyof typeof ITEM_REGISTRY]
                      ?.label ?? itemType;
                  return (
                    <label
                      key={itemType}
                      className="flex items-center gap-1.5 cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={!excluded}
                        onChange={() => toggleItem(itemType)}
                        className="accent-yellow-500"
                      />
                      <span
                        className={
                          excluded ? "text-neutral-500" : "text-neutral-300"
                        }
                      >
                        {label}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export const zonesWidget: WidgetDefinition = {
  id: "zones",
  label: "Zones",
  icon: MapPin,
  component: ZonesWidget,
};
