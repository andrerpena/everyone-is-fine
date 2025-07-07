import { dark } from "./dark";
import { light } from "./light";
import { terminal } from "./terminal";

export const themeMap = {
  light: light,
  dark: dark,
  terminal: terminal,
} as const;

export type AvailableThemeId = keyof typeof themeMap;
