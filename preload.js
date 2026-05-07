// preload.js — sandbox-safe, no fs/path

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {

  send: (channel, data) => {
    const valid = [
      "app-ready", "message",
      "check-for-update",   // user opened modal
      "start-download",     // user clicked Download
      "install-update"      // user clicked Restart & Install
    ];
    if (valid.includes(channel)) ipcRenderer.send(channel, data);
  },

  receive: (channel, callback) => {
    const valid = [
      "update-checking",       // started checking
      "update-available",      // new version found
      "update-not-available",  // already up to date
      "update-progress",       // download progress %
      "update-downloaded",     // download complete
      "update-error",          // something went wrong
      "message-reply"
    ];
    if (valid.includes(channel)) {
      ipcRenderer.on(channel, (_event, ...args) => callback(...args));
    }
  },

  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

  scanFontsFolder: () => ipcRenderer.invoke("scan-fonts"),

  platform: process.platform,
  versions: process.versions
});

window.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Preload loaded");
});