import { contextBridge } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

// Expose electron APIs to the renderer process.
// In the renderer, access via `window.electron` and `window.api`.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", {});
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = electronAPI;
  window.api = {};
}
