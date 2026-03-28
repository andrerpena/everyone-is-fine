import { electronAPI } from "@electron-toolkit/preload";
import { contextBridge } from "electron";

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
  // biome-ignore lint/suspicious/noExplicitAny: Electron preload context has window but no DOM types
  const win = window as any;
  win.electron = electronAPI;
  win.api = {};
}
