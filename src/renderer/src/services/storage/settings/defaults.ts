import type { GameSettings } from "../types";

export const DEFAULT_SETTINGS: GameSettings = {
  audio: {
    masterVolume: 0.8,
    musicVolume: 0.7,
    sfxVolume: 0.8,
    muted: false,
  },
  graphics: {
    resolution: "auto",
    pixelRatio: 1,
    showFPS: false,
    particleQuality: "medium",
  },
  gameplay: {
    autoSaveInterval: 5,
    gameSpeed: 1,
    tutorialsEnabled: true,
  },
  ui: {
    language: "en",
    theme: "dark",
    hudScale: 1,
  },
};
