// main.js

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs   = require("fs");
const { autoUpdater } = require("electron-updater");

let win;

// ══════════════════════════════════════════════════════════
//  KEY FIX for slow/stuck downloads:
//  autoDownload = false  → we control when download starts.
//  User sees "Update Available" first, clicks Download,
//  then we call autoUpdater.downloadUpdate() explicitly.
// ══════════════════════════════════════════════════════════
autoUpdater.autoDownload         = false;
autoUpdater.autoInstallOnAppQuit = true;

// ── Font scanning ─────────────────────────────────────────
ipcMain.handle("scan-fonts", () => {
  const fontsDir = path.join(__dirname, "assets", "fonts");
  if (!fs.existsSync(fontsDir)) return [];
  return fs.readdirSync(fontsDir)
    .filter(f => /\.(ttf|otf|woff|woff2)$/i.test(f))
    .map(name => {
      const buf = fs.readFileSync(path.join(fontsDir, name));
      const ext = name.split(".").pop().toLowerCase();
      const mime = ext==="woff2"?"font/woff2":ext==="woff"?"font/woff":ext==="otf"?"font/otf":"font/truetype";
      return { name, ext, dataUrl:`data:${mime};base64,${buf.toString("base64")}` };
    });
});

// ── Window ────────────────────────────────────────────────
function createWindow() {
  win = new BrowserWindow({
    width: 1600, height: 1000,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "icon.ico"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js")
    }
  });
  win.loadFile("WeddingStudio.html");
  win.webContents.on("did-finish-load", () => {
    if (app.isPackaged) setTimeout(triggerCheck, 3000);
  });
}

function send(channel, payload) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}

// ── Auto-updater events ───────────────────────────────────
function setupAutoUpdater() {
  autoUpdater.on("checking-for-update", () => {
    console.log("Checking for updates...");
    send("update-checking", {});
  });

  autoUpdater.on("update-available", (info) => {
    console.log("Update available:", info.version);
    const notes = typeof info.releaseNotes === "string"
      ? info.releaseNotes.replace(/<[^>]*>/g, "").trim()
      : (info.releaseNotes ? JSON.stringify(info.releaseNotes) : "");
    send("update-available", { version: info.version, releaseNotes: notes });
  });

  autoUpdater.on("update-not-available", () => {
    console.log("Up to date.");
    send("update-not-available", {});
  });

  autoUpdater.on("download-progress", (p) => {
    const pct = Math.round(p.percent);
    console.log(`Download: ${pct}% @ ${Math.round(p.bytesPerSecond/1024)} KB/s`);
    send("update-progress", {
      percent: pct,
      bytesPerSecond: p.bytesPerSecond,
      transferred: p.transferred,
      total: p.total
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    console.log("Downloaded:", info.version);
    send("update-downloaded", { version: info.version });
  });

  autoUpdater.on("error", (e) => {
    const msg = e ? e.message : "Unknown error";
    console.error("Updater error:", msg);
    send("update-error", { message: msg });
  });
}

function triggerCheck() {
  autoUpdater.checkForUpdates().catch(e => {
    send("update-error", { message: e ? e.message : "Could not check for updates" });
  });
}

// ── IPC from renderer ─────────────────────────────────────
ipcMain.on("check-for-update", () => {
  if (!app.isPackaged) {
    send("update-error", { message: "Update checks only work in the packaged .exe, not in dev mode." });
    return;
  }
  triggerCheck();
});

ipcMain.on("start-download", () => {
  autoUpdater.downloadUpdate().catch(e => {
    send("update-error", { message: "Download failed: " + (e ? e.message : "Unknown") });
  });
});

ipcMain.on("install-update", () => {
  autoUpdater.quitAndInstall();
});

// ── Lifecycle ─────────────────────────────────────────────
app.whenReady().then(() => {
  console.log("App ready:", app.getAppPath());
  setupAutoUpdater();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});