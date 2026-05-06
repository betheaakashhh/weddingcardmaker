
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


contextBridge.exposeInMainWorld('electronAPI', {
  scanFontsFolder: () => {
    // __dirname in preload = your app root
    const fontsDir = path.join(__dirname, 'assets', 'fonts');
    if (!fs.existsSync(fontsDir)) return [];
    const files = fs.readdirSync(fontsDir)
      .filter(f => /\.(ttf|otf|woff|woff2)$/i.test(f));
    return files.map(name => {
      const filePath = path.join(fontsDir, name);
      const buffer   = fs.readFileSync(filePath);
      const ext      = name.split('.').pop().toLowerCase();
      const mime     = ext === 'woff2' ? 'font/woff2'
                     : ext === 'woff'  ? 'font/woff'
                     : ext === 'otf'   ? 'font/otf'
                     : 'font/truetype';
      const base64   = buffer.toString('base64');
      return { name, ext, dataUrl: `data:${mime};base64,${base64}` };
    });
  }
});  

window.addEventListener("DOMContentLoaded", () => {
  console.log("Preload script loaded successfully");
});

