import { User } from "lucide-react";
import { useSelectedCharacter } from "../../../game-state";
import { useGameStore } from "../../../game-state/store";
import {
  type ColonistInspectorData,
  colonistInspectorSchema,
} from "../../../schemas";
import { getRelationshipLabel } from "../../../simulation/relationships";
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

/** Format relationships map into a display string */
function formatRelationships(
  relationships: Record<string, number>,
  allCharacters: Map<string, Character>,
  partnerId: string | null,
): string {
  const entries = Object.entries(relationships);
  if (entries.length === 0) return "No relationships";

  return entries
    .sort(([, a], [, b]) => b - a)
    .map(([id, opinion]) => {
      const name = allCharacters.get(id)?.name ?? "Unknown";
      const label = getRelationshipLabel(opinion, id === partnerId);
      return `${name}: ${label} (${opinion > 0 ? "+" : ""}${opinion})`;
    })
    .join(", ");
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

  const allCharacters = useGameStore((state) => state.simulation.characters);

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
    relationships,
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
    relationships: formatRelationships(
      relationships,
      allCharacters,
      character.partner,
    ),
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
