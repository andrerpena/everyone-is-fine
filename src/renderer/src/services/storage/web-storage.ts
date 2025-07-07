import { parseStoredConfig } from "./config-helpers";
import { DEFAULT_SETTINGS } from "./settings/defaults";
import type {
  ConfigLoadResult,
  ConfigStorageData,
  ConfigStorageProvider,
  GameSave,
  GameSettings,
  SaveMetadata,
  SaveStorageProvider,
  SettingsStorageProvider,
  StorageResult,
  StorageService,
} from "./types";

const DB_NAME = "colony-game";
const DB_VERSION = 1;
const SAVES_STORE = "saves";
const SETTINGS_KEY = "colony:settings";
const CONFIG_KEY = "colony:config";

/**
 * IndexedDB wrapper for game saves
 */
class WebSaveStorage implements SaveStorageProvider {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(SAVES_STORE)) {
          const store = db.createObjectStore(SAVES_STORE, {
            keyPath: "metadata.id",
          });
          store.createIndex("updatedAt", "metadata.updatedAt", {
            unique: false,
          });
          store.createIndex("name", "metadata.name", { unique: false });
        }
      };
    });
  }

  private getStore(mode: IDBTransactionMode): IDBObjectStore {
    if (!this.db) {
      throw new Error("Database not initialized");
    }
    const transaction = this.db.transaction(SAVES_STORE, mode);
    return transaction.objectStore(SAVES_STORE);
  }

  async saveGame<T>(
    _id: string,
    data: GameSave<T>,
  ): Promise<StorageResult<void>> {
    try {
      await this.init();
      return new Promise((resolve) => {
        const store = this.getStore("readwrite");
        const request = store.put(data);

        request.onsuccess = () => resolve({ success: true });
        request.onerror = () =>
          resolve({ success: false, error: String(request.error) });
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async loadGame<T>(id: string): Promise<StorageResult<GameSave<T>>> {
    try {
      await this.init();
      return new Promise((resolve) => {
        const store = this.getStore("readonly");
        const request = store.get(id);

        request.onsuccess = () => {
          if (request.result) {
            resolve({ success: true, data: request.result });
          } else {
            resolve({ success: false, error: "Save not found" });
          }
        };
        request.onerror = () =>
          resolve({ success: false, error: String(request.error) });
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deleteGame(id: string): Promise<StorageResult<void>> {
    try {
      await this.init();
      return new Promise((resolve) => {
        const store = this.getStore("readwrite");
        const request = store.delete(id);

        request.onsuccess = () => resolve({ success: true });
        request.onerror = () =>
          resolve({ success: false, error: String(request.error) });
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async listSaves(): Promise<StorageResult<SaveMetadata[]>> {
    try {
      await this.init();
      return new Promise((resolve) => {
        const store = this.getStore("readonly");
        const index = store.index("updatedAt");
        const request = index.openCursor(null, "prev"); // Sort by updatedAt desc

        const saves: SaveMetadata[] = [];

        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            saves.push(cursor.value.metadata);
            cursor.continue();
          } else {
            resolve({ success: true, data: saves });
          }
        };
        request.onerror = () =>
          resolve({ success: false, error: String(request.error) });
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async getSaveExists(id: string): Promise<boolean> {
    const result = await this.loadGame(id);
    return result.success;
  }

  async exportSave(id: string): Promise<StorageResult<Blob>> {
    const result = await this.loadGame(id);
    if (!result.success || !result.data) {
      return { success: false, error: result.error };
    }
    const blob = new Blob([JSON.stringify(result.data)], {
      type: "application/json",
    });
    return { success: true, data: blob };
  }

  async importSave(file: File | Blob): Promise<StorageResult<SaveMetadata>> {
    try {
      const text = await file.text();
      const save: GameSave = JSON.parse(text);
      await this.saveGame(save.metadata.id, save);
      return { success: true, data: save.metadata };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}

/**
 * localStorage wrapper for settings (small key-value data)
 */
class WebSettingsStorage implements SettingsStorageProvider {
  async loadSettings(): Promise<StorageResult<GameSettings>> {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (!stored) {
        return { success: true, data: DEFAULT_SETTINGS };
      }
      const settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      return { success: true, data: settings };
    } catch {
      return { success: true, data: DEFAULT_SETTINGS };
    }
  }

  async saveSettings(settings: GameSettings): Promise<StorageResult<void>> {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async resetSettings(): Promise<StorageResult<GameSettings>> {
    localStorage.removeItem(SETTINGS_KEY);
    return { success: true, data: DEFAULT_SETTINGS };
  }

  async updateSetting<K extends keyof GameSettings>(
    category: K,
    values: Partial<GameSettings[K]>,
  ): Promise<StorageResult<void>> {
    const result = await this.loadSettings();
    if (!result.success || !result.data) {
      return { success: false, error: result.error };
    }

    const updated = {
      ...result.data,
      [category]: { ...result.data[category], ...values },
    };

    return this.saveSettings(updated);
  }
}

/**
 * localStorage wrapper for configuration (dot-notation key-value pairs).
 * Saves both raw text and last valid JSON to preserve user edits.
 */
class WebConfigStorage implements ConfigStorageProvider {
  async loadConfig(): Promise<StorageResult<ConfigLoadResult>> {
    try {
      const content = localStorage.getItem(CONFIG_KEY);
      return { success: true, data: parseStoredConfig(content) };
    } catch {
      // localStorage error - return empty default
      return {
        success: true,
        data: { text: "{}", lastValidJson: {}, parseError: null },
      };
    }
  }

  async saveConfig(data: ConfigStorageData): Promise<StorageResult<void>> {
    try {
      // Save wrapper object with both text and lastValidJson
      const content = JSON.stringify(data);
      localStorage.setItem(CONFIG_KEY, content);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async resetConfig(): Promise<StorageResult<void>> {
    localStorage.removeItem(CONFIG_KEY);
    return { success: true };
  }
}

export async function createWebStorage(): Promise<StorageService> {
  const saveStorage = new WebSaveStorage();
  await saveStorage.init();

  return {
    saves: saveStorage,
    settings: new WebSettingsStorage(),
    config: new WebConfigStorage(),
    platform: "web",
  };
}
