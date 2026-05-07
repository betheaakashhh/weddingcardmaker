// preload.js — sandbox-safe, no fs/path

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {

  // ── IPC send (renderer → main) ──────────────────────────
  send: (channel, data) => {
    const valid = ["app-ready", "message", "update-check", "install-update"];
    if (valid.includes(channel)) ipcRenderer.send(channel, data);
  },

  // ── IPC receive (main → renderer) ───────────────────────
  receive: (channel, callback) => {
    const valid = [
      "update-available",
      "update-not-available",
      "update-downloaded",
      "update-progress",
      "update-error",
      "message-reply"
    ];
    if (valid.includes(channel)) {
      ipcRenderer.on(channel, (_event, ...args) => callback(...args));
    }
  },

  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

  // ── Font scanning — now goes to main process via IPC ────
  scanFontsFolder: () => ipcRenderer.invoke("scan-fonts"),

  platform: process.platform,
  versions: process.versions
});

window.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Preload loaded successfully");
});