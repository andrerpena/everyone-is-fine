import { Users } from "lucide-react";
import { useMemo } from "react";
import { useCharactersArray } from "../../../game-state";
import { characterSchema } from "../../../schemas";
import { EntityListWidget } from "../EntityListWidget";
import type { WidgetComponentProps, WidgetDefinition } from "../types";

function CharactersWidget(_props: WidgetComponentProps) {
  const characters = useCharactersArray();

  // Transform characters to match schema shape
  const data = useMemo(
    () =>
      characters.map((char) => ({
        id: char.id,
        name: char.name,
        type: char.type,
        position: `${char.position.x}, ${char.position.y}, ${char.position.z}`,
      })),
    [characters],
  );

  return (
    <EntityListWidget
      config={{
        schema: characterSchema,
        entityType: "colonist",
        getRowKey: (row) => row.id as string,
        visibleColumns: ["name", "type", "position"],
        searchFields: ["name", "type"],
        searchPlaceholder: "Search characters...",
        showCheckboxSelection: true,
        multiSelect: true,
      }}
      data={data}
    />
  );
}

export const charactersWidget: WidgetDefinition = {
  id: "characters",
  label: "Characters",
  icon: Users,
  component: CharactersWidget,
};
