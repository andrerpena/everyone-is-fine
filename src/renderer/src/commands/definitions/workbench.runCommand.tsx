import { Terminal } from "lucide-react";
import { SearchableTreeNavigator } from "../../components/command-palette";
import { ModalFrame } from "../../components/floating/modal";
import type { MenuItem } from "../../menu/types";
import { defineCommand } from "../defineCommand";

export const workbenchRunCommand = defineCommand({
  id: "workbench.runCommand",
  name: "Run Command",
  icon: Terminal,
  execute: (context) => {
    // Get only executable commands (those with execute function)
    const commands = context.commands.getExecutableCommands();
    const commandItems: MenuItem[] = commands.map((command) => ({
      id: command.id,
      icon: command.icon || Terminal,
      label: command.name,
      onExecute: () => {
        context.modal.closeModal();
        context.commands.dispatch(command.id);
      },
    }));
    context.modal.openModal({
      content: (
        <ModalFrame data-testid="command-palette">
          <SearchableTreeNavigator
            items={commandItems}
            placeHolder="Search in commands..."
            data-testid="command-palette-navigator"
          />
        </ModalFrame>
      ),
      alignment: "top",
      size: "lg",
      showBackdrop: true,
    });
  },
});
