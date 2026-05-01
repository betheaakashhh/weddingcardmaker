
// preload.js

const { contextBridge, ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

// ════════════════════════════════════════════════
// Electron APIs
// ════════════════════════════════════════════════

contextBridge.exposeInMainWorld("electronAPI", {

  send: (channel, data) => {
    const validChannels = ["app-ready", "message", "update-check"];

    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  receive: (channel, callback) => {
    const validChannels = [
      "message-reply",
      "update-available",
      "update-downloaded"
    ];

    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },

  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },

  platform: process.platform,
  versions: process.versions
});

// ════════════════════════════════════════════════
// FONT DISCOVERY SYSTEM
// ════════════════════════════════════════════════


contextBridge.exposeInMainWorld("electronFonts", {
  getBundledFonts
});  

window.addEventListener("DOMContentLoaded", () => {
  console.log("Preload script loaded successfully");
});

