import { Briefcase } from "lucide-react";
import { useCallback } from "react";
import { useCharactersArray } from "../../../game-state";
import { useGameStore } from "../../../game-state/store";
import {
  ALL_WORK_TYPES,
  type WorkPriorityLevel,
  type WorkType,
} from "../../../simulation/work-priorities";
import type { WidgetComponentProps, WidgetDefinition } from "../types";

/** Human-readable labels for work types */
const WORK_TYPE_LABELS: Record<WorkType, string> = {
  hauling: "Haul",
  construction: "Build",
  growing: "Grow",
  cooking: "Cook",
  mining: "Mine",
};

/** Color for each priority level */
const PRIORITY_COLORS: Record<WorkPriorityLevel, string> = {
  0: "text-neutral-500",
  1: "text-green-400",
  2: "text-blue-400",
  3: "text-yellow-400",
  4: "text-orange-400",
};

function WorkPrioritiesWidget(_props: WidgetComponentProps) {
  const characters = useCharactersArray();
  const updateCharacter = useGameStore((state) => state.updateCharacter);

  const cyclePriority = useCallback(
    (charId: string, workType: WorkType, current: WorkPriorityLevel) => {
      const next = ((current + 1) % 5) as WorkPriorityLevel;
      const character = characters.find((c) => c.id === charId);
      if (!character) return;
      updateCharacter(charId, {
        workPriorities: { ...character.workPriorities, [workType]: next },
      });
    },
    [characters, updateCharacter],
  );

  if (characters.length === 0) {
    return (
      <div className="p-4 text-sm text-neutral-400">No colonists yet.</div>
    );
  }

  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-neutral-700">
            <th className="text-left p-1.5 pl-2 font-medium text-neutral-300 sticky left-0 bg-neutral-900 z-10">
              Name
            </th>
            {ALL_WORK_TYPES.map((wt) => (
              <th
                key={wt}
                className="p-1.5 font-medium text-neutral-300 text-center min-w-[40px]"
              >
                {WORK_TYPE_LABELS[wt]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {characters.map((char) => (
            <tr
              key={char.id}
              className="border-b border-neutral-800 hover:bg-neutral-800/50"
            >
              <td className="p-1.5 pl-2 text-neutral-200 sticky left-0 bg-neutral-900 z-10 whitespace-nowrap">
                {char.name}
              </td>
              {ALL_WORK_TYPES.map((wt) => {
                const priority = char.workPriorities[wt];
                return (
                  <td key={wt} className="p-0 text-center">
                    <button
                      type="button"
                      className={`w-full h-full p-1.5 cursor-pointer hover:bg-neutral-700/50 font-mono font-bold ${PRIORITY_COLORS[priority]}`}
                      onClick={() => cyclePriority(char.id, wt, priority)}
                      title={`${WORK_TYPE_LABELS[wt]}: ${priority === 0 ? "Disabled" : `Priority ${priority}`}`}
                    >
                      {priority === 0 ? "-" : priority}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const workPrioritiesWidget: WidgetDefinition = {
  id: "work-priorities",
  label: "Work",
  icon: Briefcase,
  component: WorkPrioritiesWidget,
};
