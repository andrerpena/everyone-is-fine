import { Moon, Palette, Sun } from "lucide-react";
import { SearchableTreeNavigator } from "../../components/command-palette";
import { ModalFrame } from "../../components/floating/modal";
import type { MenuItem } from "../../menu/types";
import type { AvailableThemeId } from "../../theming/themes";
import { defineCommand } from "../defineCommand";

export const workbenchSetTheme = defineCommand({
  id: "workbench.setTheme",
  name: "Set Theme",
  icon: Palette,
  execute: (context) => {
    // Get available themes from context
    const availableThemeIds = Object.keys(
      context.theming.themeMap,
    ) as AvailableThemeId[];

    // We need the original theme to revert back if the modal is dismissed
    const originalTheme = context.theming.activeThemeId;

    // Sort themes: current theme first, then others alphabetically
    const currentTheme = context.theming.activeThemeId;
    const otherThemes = availableThemeIds
      .filter((themeId) => themeId !== currentTheme)
      .sort((a, b) => a.localeCompare(b));
    const sortedThemes = [currentTheme, ...otherThemes];

    const themeItems: MenuItem[] = sortedThemes.map((themeId) => {
      const theme = context.theming.themeMap[themeId];
      return {
        id: themeId,
        icon: theme?.type === "dark" ? Moon : Sun,
        label: theme?.name || themeId,
        subtitle: `Switch to ${themeId} theme`,
        onExecute: () => {
          context.modal.closeAllModals();
          context.theming.setActiveThemeId(themeId);
        },
        onFocus: () => {
          // Preview the theme when focused
          context.theming.setActiveThemeId(themeId);
        },
      };
    });

    context.modal.openModal({
      content: (
        <ModalFrame data-testid="theme-picker">
          <SearchableTreeNavigator
            items={themeItems}
            placeHolder="Search themes..."
            data-testid="theme-picker-navigator"
          />
        </ModalFrame>
      ),
      alignment: "top",
      size: "lg",
      showBackdrop: true,
      onDismiss: () => {
        // Revert to the original theme if modal is dismissed
        context.theming.setActiveThemeId(originalTheme);
      },
    });
  },
});
