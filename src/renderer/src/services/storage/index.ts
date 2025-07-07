import type { StorageService } from "./types";

let storageServiceInstance: StorageService | null = null;

export async function getStorageService(): Promise<StorageService> {
  if (storageServiceInstance) {
    return storageServiceInstance;
  }
  const { createWebStorage } = await import("./web-storage");
  storageServiceInstance = await createWebStorage();
  return storageServiceInstance;
}

export * from "./types";
