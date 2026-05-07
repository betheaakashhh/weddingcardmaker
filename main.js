const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { autoUpdater } = require("electron-updater");

let win;

// ── Font scanning (moved from preload — fs belongs in main process) ──
ipcMain.handle("scan-fonts", () => {
  const fontsDir = path.join(__dirname, "assets", "fonts");
  if (!fs.existsSync(fontsDir)) return [];

  return fs.readdirSync(fontsDir)
    .filter(f => /\.(ttf|otf|woff|woff2)$/i.test(f))
    .map(name => {
      const filePath = path.join(fontsDir, name);
      const buffer   = fs.readFileSync(filePath);
      const ext      = name.split(".").pop().toLowerCase();
      const mime     = ext === "woff2" ? "font/woff2"
                     : ext === "woff"  ? "font/woff"
                     : ext === "otf"   ? "font/otf"
                     : "font/truetype";
      return { name, ext, dataUrl: `data:${mime};base64,${buffer.toString("base64")}` };
    });
});

function createWindow() {
  win = new BrowserWindow({
    width: 1600,
    height: 1000,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "icon.ico"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      // sandbox stays at default (true) — fs moved to main process above
      preload: path.join(__dirname, "preload.js")
    }
  });

  win.loadFile("WeddingStudio.html");

  win.webContents.on("did-finish-load", () => {
    setupAutoUpdater();
  });
}

function setupAutoUpdater() {
  if (!app.isPackaged) {
    console.log("⚠️  Auto-update disabled in development mode.");
    return;
  }

  function sendToRenderer(channel, payload) {
    if (win && !win.isDestroyed()) {
      win.webContents.send(channel, payload);
    }
  }

  autoUpdater.on("update-available",     (info) => sendToRenderer("update-available",     { version: info.version }));
  autoUpdater.on("update-not-available", ()     => sendToRenderer("update-not-available", {}));
  autoUpdater.on("download-progress",    (p)    => sendToRenderer("update-progress",      { percent: Math.round(p.percent) }));
  autoUpdater.on("update-downloaded",    (info) => sendToRenderer("update-downloaded",    { version: info.version }));
  autoUpdater.on("error",                (e)    => console.error("Updater error:", e?.message));

  autoUpdater.checkForUpdatesAndNotify().catch(e => console.error("Update check failed:", e?.message));
}

ipcMain.on("install-update", () => autoUpdater.quitAndInstall());

app.whenReady().then(() => {
  console.log("✅ App ready");
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});