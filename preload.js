// preload.js

const { contextBridge, ipcRenderer } = require("electron");
const fs   = require("fs");
const path = require("path");

// ════════════════════════════════════════════════════════════
//  ⚠️  FIX: Only ONE call to exposeInMainWorld per name.
//      Previously there were TWO calls with 'electronAPI',
//      which silently wiped out all the IPC send/receive APIs.
// ════════════════════════════════════════════════════════════

contextBridge.exposeInMainWorld("electronAPI", {

  // ── IPC send (renderer → main) ──────────────────────────
  send: (channel, data) => {
    const validChannels = ["app-ready", "message", "update-check", "install-update"];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  // ── IPC receive (main → renderer) ───────────────────────
  receive: (channel, callback) => {
    const validChannels = [
      "message-reply",
      "update-available",    // ← fired when a new version is found
      "update-downloaded",   // ← fired when download is complete, ready to install
      "update-not-available",
      "update-progress",
      "update-error"
    ];
    if (validChannels.includes(channel)) {
      // Wrap to strip the internal Electron 'event' from the callback
      ipcRenderer.on(channel, (_event, ...args) => callback(...args));
    }
  },

  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },

  platform: process.platform,
  versions: process.versions,

  // ── Font discovery ───────────────────────────────────────
  scanFontsFolder: () => {
    const fontsDir = path.join(__dirname, "assets", "fonts");
    if (!fs.existsSync(fontsDir)) return [];

    const files = fs.readdirSync(fontsDir)
      .filter(f => /\.(ttf|otf|woff|woff2)$/i.test(f));

    return files.map(name => {
      const filePath = path.join(fontsDir, name);
      const buffer   = fs.readFileSync(filePath);
      const ext      = name.split(".").pop().toLowerCase();
      const mime     = ext === "woff2" ? "font/woff2"
                     : ext === "woff"  ? "font/woff"
                     : ext === "otf"   ? "font/otf"
                     : "font/truetype";
      return { name, ext, dataUrl: `data:${mime};base64,${buffer.toString("base64")}` };
    });
  }

});

window.addEventListener("DOMContentLoaded", () => {
  console.log("Preload script loaded successfully");
});