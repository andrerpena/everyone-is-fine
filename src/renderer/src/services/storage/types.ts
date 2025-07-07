/**
 * Metadata for a saved game
 */
export interface SaveMetadata {
  id: string;
  name: string;
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
  version: string; // Game version for migration
  playtime: number; // Seconds
  thumbnail?: string; // Base64 image (optional)
}

/**
 * A complete save file
 */
export interface GameSave<T = unknown> {
  metadata: SaveMetadata;
  data: T; // The actual game state
}

/**
 * Settings data structure
 */
export interface GameSettings {
  audio: {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    muted: boolean;
  };
  graphics: {
    resolution: "auto" | "720p" | "1080p" | "1440p";
    pixelRatio: number;
    showFPS: boolean;
    particleQuality: "low" | "medium" | "high";
  };
  gameplay: {
    autoSaveInterval: number; // minutes, 0 = disabled
    gameSpeed: number;
    tutorialsEnabled: boolean;
  };
  ui: {
    language: string;
    theme: "light" | "dark" | "system";
    hudScale: number;
  };
}

/**
 * Result of storage operations
 */
export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Save storage provider interface
 */
export interface SaveStorageProvider {
  // Save operations
  saveGame<T>(id: string, data: GameSave<T>): Promise<StorageResult<void>>;
  loadGame<T>(id: string): Promise<StorageResult<GameSave<T>>>;
  deleteGame(id: string): Promise<StorageResult<void>>;

  // List/query operations
  listSaves(): Promise<StorageResult<SaveMetadata[]>>;
  getSaveExists(id: string): Promise<boolean>;

  // Import/Export for sharing saves
  exportSave(id: string): Promise<StorageResult<Blob>>;
  importSave(file: File | Blob): Promise<StorageResult<SaveMetadata>>;
}

/**
 * Settings storage provider interface
 */
export interface SettingsStorageProvider {
  loadSettings(): Promise<StorageResult<GameSettings>>;
  saveSettings(settings: GameSettings): Promise<StorageResult<void>>;
  resetSettings(): Promise<StorageResult<GameSettings>>;

  // Granular updates
  updateSetting<K extends keyof GameSettings>(
    category: K,
    values: Partial<GameSettings[K]>,
  ): Promise<StorageResult<void>>;
}

/**
 * Configuration value that can be stored.
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
 * Stored config format - includes both raw text and last valid JSON.
 * This allows the UI to show user's edits (even if invalid) while
 * the app uses the last known valid config.
 */
export interface ConfigStorageData {
  /** Raw text from editor (may be invalid JSON) */
  text: string;
  /** Last valid JSON config (used for actual settings) */
  lastValidJson: ConfigRecord;
}

/**
 * Result of loading config.
 */
export interface ConfigLoadResult {
  /** Raw text from storage */
  text: string;
  /** Last valid JSON config */
  lastValidJson: ConfigRecord;
  /** Parse error if text is invalid JSON (null if valid) */
  parseError: string | null;
}

/**
 * Configuration storage provider interface.
 * Saves both raw text and last valid JSON to preserve edits.
 */
export interface ConfigStorageProvider {
  /** Load config - returns text and last valid JSON */
  loadConfig(): Promise<StorageResult<ConfigLoadResult>>;
  /** Save both text and last valid JSON */
  saveConfig(data: ConfigStorageData): Promise<StorageResult<void>>;
  /** Reset config to empty */
  resetConfig(): Promise<StorageResult<void>>;
}

/**
 * Combined storage service
 */
export interface StorageService {
  saves: SaveStorageProvider;
  settings: SettingsStorageProvider;
  config: ConfigStorageProvider;

  readonly platform: "web";
}
