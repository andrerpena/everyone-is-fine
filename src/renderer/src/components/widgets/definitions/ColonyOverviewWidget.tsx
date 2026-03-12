import { LayoutDashboard } from "lucide-react";
import { useMemo } from "react";
import { useCharactersArray, useWorld } from "../../../game-state";
import { getNeedThreshold } from "../../../simulation/needs/needs-config";
import { ITEM_REGISTRY } from "../../../world/registries/item-registry";
import type { ItemCategory } from "../../../world/types";
import { countAllItemsOnMap } from "../../../world/utils/material-counter";
import type { WidgetComponentProps, WidgetDefinition } from "../types";

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

/** Category display order */
const CATEGORY_ORDER: ItemCategory[] = [
  "food",
  "resource",
  "medicine",
  "weapon",
  "apparel",
  "tool",
  "artifact",
];

function ColonyOverviewWidget(_props: WidgetComponentProps) {
  const characters = useCharactersArray();
  const world = useWorld();

  const colonistStats = useMemo(() => {
    if (characters.length === 0) return null;

    const avgMood =
      characters.reduce((sum, c) => sum + c.needs.mood, 0) / characters.length;
    const starving = characters.filter(
      (c) => getNeedThreshold(c.needs.hunger) === "critical",
    ).length;
    const exhausted = characters.filter(
      (c) => getNeedThreshold(c.needs.energy) === "critical",
    ).length;
    const mentalBreaks = characters.filter(
      (c) => c.mentalBreak !== null,
    ).length;
    const partnered = characters.filter((c) => c.partner !== null).length;
    const married = characters.filter((c) => c.spouse !== null).length;

    return {
      total: characters.length,
      avgMood,
      starving,
      exhausted,
      mentalBreaks,
      partnered,
      married,
    };
  }, [characters]);

  const resourcesByCategory = useMemo(() => {
    if (!world)
      return new Map<ItemCategory, Array<{ label: string; count: number }>>();

    const allItems = countAllItemsOnMap(world);
    const grouped = new Map<
      ItemCategory,
      Array<{ label: string; count: number }>
    >();

    for (const [itemType, count] of allItems) {
      const props = ITEM_REGISTRY[itemType as keyof typeof ITEM_REGISTRY];
      if (!props) continue;

      let list = grouped.get(props.category);
      if (!list) {
        list = [];
        grouped.set(props.category, list);
      }
      list.push({ label: props.label, count });
    }

    return grouped;
  }, [world]);

  return (
    <div className="overflow-auto h-full p-2 space-y-3 text-xs">
      {/* Colonist Summary */}
      <Section title="Colonists">
        {colonistStats ? (
          <div className="space-y-1">
            <StatRow label="Total" value={colonistStats.total} />
            <StatRow
              label="Avg Mood"
              value={`${Math.round(colonistStats.avgMood * 100)}%`}
              color={moodColor(colonistStats.avgMood)}
            />
            {colonistStats.starving > 0 && (
              <StatRow
                label="Starving"
                value={colonistStats.starving}
                color="text-red-400"
              />
            )}
            {colonistStats.exhausted > 0 && (
              <StatRow
                label="Exhausted"
                value={colonistStats.exhausted}
                color="text-orange-400"
              />
            )}
            {colonistStats.mentalBreaks > 0 && (
              <StatRow
                label="Mental Breaks"
                value={colonistStats.mentalBreaks}
                color="text-red-400"
              />
            )}
            {colonistStats.married > 0 && (
              <StatRow label="Married" value={colonistStats.married} />
            )}
            {colonistStats.partnered > colonistStats.married && (
              <StatRow
                label="In Relationship"
                value={colonistStats.partnered - colonistStats.married}
              />
            )}
          </div>
        ) : (
          <span className="text-neutral-500">No colonists</span>
        )}
      </Section>

      {/* Resources */}
      {CATEGORY_ORDER.map((cat) => {
        const items = resourcesByCategory.get(cat);
        if (!items || items.length === 0) return null;

        return (
          <Section key={cat} title={CATEGORY_LABELS[cat]}>
            <div className="space-y-0.5">
              {items.map((item) => (
                <StatRow
                  key={item.label}
                  label={item.label}
                  value={item.count}
                />
              ))}
            </div>
          </Section>
        );
      })}

      {resourcesByCategory.size === 0 && (
        <Section title="Resources">
          <span className="text-neutral-500">No items on map</span>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
        {title}
      </h3>
      {children}
    </div>
  );
}

function StatRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between px-1">
      <span className="text-neutral-300">{label}</span>
      <span className={`font-medium ${color ?? "text-neutral-200"}`}>
        {value}
      </span>
    </div>
  );
}

function moodColor(mood: number): string {
  if (mood >= 0.7) return "text-green-400";
  if (mood >= 0.4) return "text-yellow-400";
  return "text-red-400";
}

export const colonyOverviewWidget: WidgetDefinition = {
  id: "colony-overview",
  label: "Colony Overview",
  icon: LayoutDashboard,
  component: ColonyOverviewWidget,
};
