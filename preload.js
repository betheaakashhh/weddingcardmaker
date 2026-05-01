
// preload.js

const { contextBridge, ipcRenderer } = require("electron");

// Securely expose APIs to the renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  // Send data to main process
  send: (channel, data) => {
    const validChannels = ["app-ready", "message", "update-check"];
    
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  // Receive data from main process
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

  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // Simple app info
  platform: process.platform,
  versions: process.versions
});

// Optional preload loaded log
window.addEventListener("DOMContentLoaded", () => {
  console.log("Preload script loaded successfully");
});