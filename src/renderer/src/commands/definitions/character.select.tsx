import { User, Users } from "lucide-react";
import { SearchableTreeNavigator } from "../../components/command-palette";
import { ModalFrame } from "../../components/floating/modal";
import { useGameStore } from "../../game-state/store";
import type { MenuItem } from "../../menu/types";
import { defineCommand } from "../defineCommand";

export interface CharacterSelectPayload {
  characterIds?: string[];
}

export const characterSelect = defineCommand<CharacterSelectPayload>({
  id: "character.select",
  name: "Select Character",
  icon: Users,
  execute: (context, payload) => {
    // If character IDs provided, select directly
    if (payload?.characterIds?.length) {
      if (payload.characterIds.length === 1) {
        context.game.selectCharacter(payload.characterIds[0]);
      } else {
        useGameStore
          .getState()
          .selectMultiple("colonist", payload.characterIds);
      }
      return;
    }

    // Otherwise, show a modal to select from available characters
    const characters = context.game.getCharacters();

    if (characters.length === 0) {
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
        context.game.selectCharacter(character.id);
      },
    }));

    context.modal.openModal({
      content: (
        <ModalFrame data-testid="character-picker">
          <SearchableTreeNavigator
            items={characterItems}
            placeHolder="Search characters..."
            data-testid="character-picker-navigator"
          />
        </ModalFrame>
      ),
      alignment: "top",
      size: "lg",
      showBackdrop: true,
    });
  },
});
