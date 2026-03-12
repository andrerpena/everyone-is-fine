import { MapPin, Trash2 } from "lucide-react";
import { useCallback } from "react";
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
            <tr
              key={zone.id}
              className="border-b border-neutral-800 hover:bg-neutral-800/50"
            >
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
                <ZoneConfig zone={zone} onCyclePriority={cyclePriority} />
              </td>
              <td className="p-0.5 text-center">
                <button
                  type="button"
                  className="p-1 text-neutral-500 hover:text-red-400 cursor-pointer"
                  onClick={() => deleteZone(zone.id)}
                  title={`Delete ${zone.name}`}
                >
                  <Trash2 size={12} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ZoneConfig({
  zone,
  onCyclePriority,
}: {
  zone: ZoneData;
  onCyclePriority: (zone: ZoneData) => void;
}) {
  if (zone.type === "stockpile") {
    const priority = zone.priority ?? 2;
    return (
      <button
        type="button"
        className={`cursor-pointer hover:underline font-medium ${PRIORITY_COLORS[priority]}`}
        onClick={() => onCyclePriority(zone)}
        title="Click to cycle priority"
      >
        {ZONE_PRIORITY_LABELS[priority]}
      </button>
    );
  }

  if (zone.type === "growing" && zone.cropType) {
    return <span className="text-green-300 capitalize">{zone.cropType}</span>;
  }

  return <span className="text-neutral-500">—</span>;
}

export const zonesWidget: WidgetDefinition = {
  id: "zones",
  label: "Zones",
  icon: MapPin,
  component: ZonesWidget,
};
