// This file has been automatically migrated to valid ESM format by Storybook.
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
    "@storybook/addon-themes",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal: async (config) => {
    // Ensure the alias configuration is properly set
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@renderer": resolve(__dirname, "../src/renderer/src"),
    };

    // Configure CSS modules
    config.css = config.css || {};
    config.css.modules = {
      localsConvention: "camelCase",
    };

    // Import TailwindCSS plugin
    const tailwindcss = await import("@tailwindcss/postcss");

    // Configure PostCSS
    config.css.postcss = {
      plugins: [tailwindcss.default()],
    };

    return config;
  },
};
export default config;
