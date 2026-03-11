import { User } from "lucide-react";
import { useSelectedCharacter } from "../../../game-state";
import {
  type ColonistInspectorData,
  colonistInspectorSchema,
} from "../../../schemas";
import { InspectorForm } from "../../schema-form";
import type { WidgetComponentProps, WidgetDefinition } from "../types";

/**
 * ColonistInfo widget component.
 * Displays detailed properties of the currently selected colonist.
 */
function ColonistInfoWidget(_props: WidgetComponentProps) {
  const character = useSelectedCharacter();

  if (!character) {
    return (
      <div className="p-4 text-sm text-[var(--muted-foreground)]">
        No colonist selected
      </div>
    );
  }

  const { biography, position, movement, control, needs } = character;

  const data: ColonistInspectorData = {
    name: character.name,
    age: biography.age,
    gender: biography.gender,
    position: `(${position.x}, ${position.y}, ${position.z})`,
    speed: movement.speed,
    isMoving: movement.isMoving,
    controlMode: control.mode,
    currentCommand: control.currentCommand?.type ?? "None",
    hunger: needs.hunger,
    energy: needs.energy,
    mood: needs.mood,
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
