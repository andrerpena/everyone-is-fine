import { createMoveCommand } from "../../simulation/types";
import { defineCommand } from "../defineCommand";

export interface MoveToPayload {
  characterIds: string[];
  destination: { x: number; y: number; z: number };
}

export const characterMoveTo = defineCommand<MoveToPayload>({
  id: "character.moveTo",
  name: "Move Character To",
  hidden: true,
  execute: (context, payload) => {
    if (!payload?.characterIds?.length) {
      console.warn(
        "character.moveTo requires payload: { characterIds, destination }",
      );
      return;
    }

    const { characterIds, destination } = payload;

    if (!context.game.isTilePassable(destination)) {
      console.warn("Cannot move to impassable tile:", destination);
      return;
    }

    for (const characterId of characterIds) {
      const character = context.game.getCharacter(characterId);
      if (!character) {
        console.warn(`Character ${characterId} not found, skipping`);
        continue;
      }

      const command = createMoveCommand(destination);
      context.game.issueCharacterCommand(characterId, command);
    }
  },
});
