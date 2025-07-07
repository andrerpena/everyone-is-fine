#!/usr/bin/env node
import { Command } from "commander";
import { pixelToPngCommand } from "./commands/pixel-to-png";
import { pngToPixelCommand } from "./commands/png-to-pixel";

const program = new Command();

program
  .name("colony-cli")
  .description("CLI tools for the Colony game")
  .version("1.0.0");

program.addCommand(pixelToPngCommand);
program.addCommand(pngToPixelCommand);

program.parse();
