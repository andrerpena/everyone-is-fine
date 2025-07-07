import { Focus, User } from "lucide-react";
import { SearchableTreeNavigator } from "../../components/command-palette";
import { ModalFrame } from "../../components/floating/modal";
import { viewportStore } from "../../lib/viewport-simple";
import type { MenuItem } from "../../menu/types";
import { defineCommand } from "../defineCommand";

export interface CharacterFocusPayload {
  characterIds?: string[];
}

export const characterFocus = defineCommand<CharacterFocusPayload>({
  id: "character.focus",
  name: "Focus Character",
  icon: Focus,
  execute: (context, payload) => {
    // If character IDs provided, focus directly
    if (payload?.characterIds?.length) {
      const ids = payload.characterIds;

      if (ids.length === 1) {
        // Single character - zoom in and focus
        context.commands.dispatch("character.select", { characterIds: ids });
        context.game.focusCharacter(ids[0]);
        context.commands.dispatch("world.setZoom", { scale: 2 });
      } else {
        // Multiple characters - focus on centroid
        context.commands.dispatch("character.select", { characterIds: ids });

        const chars = ids
          .map((id) => context.game.getCharacter(id))
          .filter((c): c is NonNullable<typeof c> => c != null);

        if (chars.length > 0) {
          const avgX =
            chars.reduce((sum, c) => sum + c.position.x, 0) / chars.length;
          const avgY =
            chars.reduce((sum, c) => sum + c.position.y, 0) / chars.length;
          const cellSize = 32;
          // Pan to centroid
          viewportStore.panTo(
            avgX * cellSize + cellSize / 2,
            avgY * cellSize + cellSize / 2,
          );
          // Zoom out slightly to show all characters
          context.commands.dispatch("world.setZoom", { scale: 1.5 });
        }
      }
      return;
    }

    // Otherwise, show a modal to select from available characters
    const characters = context.game.getCharacters();

    if (characters.length === 0) {
      console.warn("No characters to focus");
      return;
    }

    const currentSelection = context.game.getSelectedCharacter();

    // Sort: selected character first, then alphabetically by name
    const sortedCharacters = [...characters].sort((a, b) => {
      if (currentSelection?.id === a.id) return -1;
      if (currentSelection?.id === b.id) return 1;
      return a.name.localeCompare(b.name);
    });

    const characterItems: MenuItem[] = sortedCharacters.map((character) => ({
      id: character.id,
      icon: User,
      label: character.name,
      subtitle: `${character.type} at (${character.position.x}, ${character.position.y})`,
      onExecute: () => {
        context.modal.closeModal();
        context.commands.dispatch("character.select", {
          characterIds: [character.id],
        });
        context.game.focusCharacter(character.id);
        context.commands.dispatch("world.setZoom", { scale: 2 });
      },
    }));

    context.modal.openModal({
      content: (
        <ModalFrame data-testid="character-focus-picker">
          <SearchableTreeNavigator
            items={characterItems}
            placeHolder="Search characters to focus..."
            data-testid="character-focus-picker-navigator"
          />
        </ModalFrame>
      ),
      alignment: "top",
      size: "lg",
      showBackdrop: true,
    });
  },
});
