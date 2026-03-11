import { User } from "lucide-react";
import { useSelectedCharacter } from "../../../game-state";
import { useGameStore } from "../../../game-state/store";
import {
  type ColonistInspectorData,
  colonistInspectorSchema,
} from "../../../schemas";
import { formatSkillsSummary } from "../../../simulation/skills";
import { getThoughtDefinition } from "../../../simulation/thoughts";
import { formatTraitsSummary } from "../../../simulation/traits";
import type { Character } from "../../../simulation/types";
import { InspectorForm } from "../../schema-form";
import type { WidgetComponentProps, WidgetDefinition } from "../types";

/** Job type to human-readable activity label */
const JOB_TYPE_LABELS: Record<string, string> = {
  chop: "Chopping Tree",
  mine: "Mining Boulder",
  forage: "Foraging",
  sleep: "Sleeping",
  move: "Walking",
  wander: "Wandering",
  sad_wander: "Wandering (distressed)",
};

/** Mental break type to human-readable label */
const MENTAL_BREAK_LABELS: Record<string, string> = {
  sad_wander: "Mental Break: Sad Wander",
  food_binge: "Mental Break: Food Binge",
  daze: "Mental Break: Daze",
};

/** Compute a human-readable activity description */
function getActivityDescription(
  character: Character,
  jobType: string | null,
): string {
  if (character.mentalBreak) {
    return MENTAL_BREAK_LABELS[character.mentalBreak.type] ?? "Mental Break";
  }
  if (character.control.mode === "drafted") {
    return "Drafted";
  }
  if (jobType) {
    return JOB_TYPE_LABELS[jobType] ?? jobType;
  }
  if (character.movement.isMoving) {
    return "Walking";
  }
  return "Idle";
}

/**
 * ColonistInfo widget component.
 * Displays detailed properties of the currently selected colonist.
 */
function ColonistInfoWidget(_props: WidgetComponentProps) {
  const character = useSelectedCharacter();

  const jobType = useGameStore((state) => {
    if (!character) return null;
    return state.simulation.jobProgress.get(character.id)?.jobType ?? null;
  });

  if (!character) {
    return (
      <div className="p-4 text-sm text-[var(--muted-foreground)]">
        No colonist selected
      </div>
    );
  }

  const {
    biography,
    position,
    movement,
    control,
    needs,
    skills,
    traits,
    thoughts,
  } = character;

  const data: ColonistInspectorData = {
    name: character.name,
    age: biography.age,
    gender: biography.gender,
    position: `(${position.x}, ${position.y}, ${position.z})`,
    speed: movement.speed,
    isMoving: movement.isMoving,
    activity: getActivityDescription(character, jobType),
    controlMode: control.mode,
    currentCommand: control.currentCommand?.type ?? "None",
    hunger: needs.hunger,
    energy: needs.energy,
    mood: needs.mood,
    skills: formatSkillsSummary(skills),
    traits: formatTraitsSummary(traits),
    thoughts:
      thoughts.length > 0
        ? thoughts
            .map((t) => getThoughtDefinition(t.thoughtId)?.label ?? t.thoughtId)
            .join(", ")
        : "None",
  };

  return (
    <div className="p-3">
      <InspectorForm
        schema={colonistInspectorSchema}
        data={data}
        layout="default"
      />
    </div>
  );
}

/**
 * ColonistInfo widget definition.
 */
export const colonistInfoWidget: WidgetDefinition = {
  id: "colonist-info",
  label: "Colonist",
  icon: User,
  component: ColonistInfoWidget,
};
