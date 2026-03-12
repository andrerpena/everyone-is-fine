import { Hammer } from "lucide-react";
import { useMemo } from "react";
import {
  CONSTRUCTION_REGISTRY,
  type ConstructionCost,
} from "../../../world/registries/construction-registry";
import { ITEM_REGISTRY } from "../../../world/registries/item-registry";
import { STRUCTURE_REGISTRY } from "../../../world/registries/structure-registry";
import type { StructureCategory, StructureType } from "../../../world/types";
import type { WidgetComponentProps, WidgetDefinition } from "../types";

/** Human-readable category labels */
const CATEGORY_LABELS: Record<StructureCategory, string> = {
  wall: "Walls",
  door: "Doors",
  furniture: "Furniture",
  machine: "Machines",
  container: "Containers",
  decoration: "Decoration",
  natural: "Natural",
};

/** Category display order */
const CATEGORY_ORDER: StructureCategory[] = [
  "wall",
  "door",
  "furniture",
  "machine",
  "container",
];

/** Human-readable structure labels */
const STRUCTURE_LABELS: Partial<Record<StructureType, string>> = {
  wall_wood: "Wood Wall",
  wall_stone: "Stone Wall",
  wall_metal: "Metal Wall",
  wall_brick: "Brick Wall",
  door_wood: "Wood Door",
  door_metal: "Metal Door",
  door_auto: "Auto Door",
  bed: "Bed",
  chair: "Chair",
  table: "Table",
  workbench: "Workbench",
  stonecutter_table: "Stonecutter",
  tailoring_bench: "Tailoring Bench",
  crafting_spot: "Crafting Spot",
  campfire: "Campfire",
  nutrient_paste_dispenser: "Paste Dispenser",
  chest: "Chest",
  shelf: "Shelf",
};

interface BuildableItem {
  type: StructureType;
  label: string;
  category: StructureCategory;
  cost: ConstructionCost;
}

function formatCost(cost: ConstructionCost): string {
  return cost.materials
    .map((m) => {
      const label =
        ITEM_REGISTRY[m.type as keyof typeof ITEM_REGISTRY]?.label ?? m.type;
      return `${m.quantity} ${label}`;
    })
    .join(", ");
}

function ArchitectWidget(_props: WidgetComponentProps) {
  const grouped = useMemo(() => {
    const items: BuildableItem[] = [];

    for (const [type, cost] of Object.entries(CONSTRUCTION_REGISTRY)) {
      const structType = type as StructureType;
      const props = STRUCTURE_REGISTRY[structType];
      if (!props) continue;

      items.push({
        type: structType,
        label: STRUCTURE_LABELS[structType] ?? type,
        category: props.category,
        cost: cost as ConstructionCost,
      });
    }

    const groups = new Map<StructureCategory, BuildableItem[]>();
    for (const item of items) {
      let list = groups.get(item.category);
      if (!list) {
        list = [];
        groups.set(item.category, list);
      }
      list.push(item);
    }

    return groups;
  }, []);

  return (
    <div className="overflow-auto h-full p-2 space-y-3">
      {CATEGORY_ORDER.map((cat) => {
        const items = grouped.get(cat);
        if (!items || items.length === 0) return null;

        return (
          <div key={cat}>
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
              {CATEGORY_LABELS[cat]}
            </h3>
            <div className="space-y-0.5">
              {items.map((item) => (
                <div
                  key={item.type}
                  className="flex items-center justify-between px-2 py-1 rounded hover:bg-neutral-800/50 text-xs"
                >
                  <span className="text-neutral-200 font-medium">
                    {item.label}
                  </span>
                  <span className="text-neutral-500 text-[11px]">
                    {formatCost(item.cost)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const architectWidget: WidgetDefinition = {
  id: "architect",
  label: "Architect",
  icon: Hammer,
  component: ArchitectWidget,
};
