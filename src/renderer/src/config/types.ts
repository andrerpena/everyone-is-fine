/**
 * Configuration values supported by the config system.
 * Supports primitives, arrays, and nested objects.
 */
export type ConfigValue =
  | string
  | number
  | boolean
  | null
  | ConfigValue[]
  | { [key: string]: ConfigValue };

/**
 * Configuration record with dot-notation keys.
 * Example: { "pixi.maxFramerate": 60, "ui.theme": "dark" }
 */
export type ConfigRecord = Record<string, ConfigValue>;

/**
 * Schema definition for a configuration property.
 * Used for validation and UI generation.
 */
export interface ConfigPropertySchema {
  type: "string" | "number" | "boolean" | "object" | "array";
  default: ConfigValue;
  description?: string;
  minimum?: number;
  maximum?: number;
  enum?: ConfigValue[];
}

/**
 * Schema for all configuration properties.
 */
export type ConfigSchema = Record<string, ConfigPropertySchema>;
