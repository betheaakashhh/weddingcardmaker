// main.js

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { autoUpdater } = require("electron-updater");

let win;

// ════════════════════════════════════════════════════════════
//  Window creation
// ════════════════════════════════════════════════════════════

function createWindow() {
  win = new BrowserWindow({
    width: 1600,
    height: 1000,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "icon.ico"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js")
    }
  });

  win.loadFile("WeddingStudio.html");

  // Once the renderer is ready, start checking for updates
  win.webContents.on("did-finish-load", () => {
    console.log("Window loaded. Checking for updates...");
    setupAutoUpdater();
  });
}

// ════════════════════════════════════════════════════════════
//  Auto-updater  (user-prompted, not silent)
// ════════════════════════════════════════════════════════════

function setupAutoUpdater() {
  if (!app.isPackaged) {
    console.log("⚠️  Auto-update disabled in development mode.");
    return;
  }

  // ── Helper: safely send to renderer ─────────────────────
  function sendToRenderer(channel, payload) {
    if (win && !win.isDestroyed() && win.webContents) {
      win.webContents.send(channel, payload);
    }
  }

  // ── Updater events ──────────────────────────────────────

  autoUpdater.on("checking-for-update", () => {
    console.log("🔍 Checking for updates…");
  });

  autoUpdater.on("update-available", (info) => {
    console.log("🆕 Update available:", info.version);
    // Tell the renderer: show the "Update available" banner
    sendToRenderer("update-available", {
      version: info.version,
      releaseNotes: info.releaseNotes || ""
    });
    // Download happens automatically (autoUpdater default).
    // If you want the user to also approve the download,
    // set autoUpdater.autoDownload = false and call
    // autoUpdater.downloadUpdate() only after they confirm.
  });

  autoUpdater.on("update-not-available", () => {
    console.log("✅ App is up to date.");
    sendToRenderer("update-not-available", {});
  });

  autoUpdater.on("download-progress", (progress) => {
    console.log(`⬇️  Download: ${Math.round(progress.percent)}%`);
    sendToRenderer("update-progress", {
      percent: Math.round(progress.percent),
      bytesPerSecond: progress.bytesPerSecond
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    console.log("✅ Update downloaded:", info.version);
    // ⚠️  DO NOT call quitAndInstall() here automatically.
    // Instead, tell the renderer so the user can decide.
    sendToRenderer("update-downloaded", { version: info.version });
  });

  autoUpdater.on("error", (error) => {
    const msg = error ? error.message : "Unknown error";
    console.error("❌ Auto-updater error:", msg);
    sendToRenderer("update-error", { message: msg });
  });

  // Start the check
  autoUpdater.checkForUpdatesAndNotify().catch((err) => {
    console.error("Update check failed:", err ? err.message : "Unknown");
  });
}

// ════════════════════════════════════════════════════════════
//  IPC: renderer asks to install the downloaded update
// ════════════════════════════════════════════════════════════

ipcMain.on("install-update", () => {
  console.log("User approved update — quitting and installing…");
  autoUpdater.quitAndInstall();
});

// ════════════════════════════════════════════════════════════
//  ⚠️  FIX: Only ONE app.whenReady() call.
//      Previously there were TWO — one for logging,
//      one for real init — which caused unreliable startup.
// ════════════════════════════════════════════════════════════

app.whenReady().then(() => {
  console.log("✅ App is ready.");
  console.log("   APP PATH :", app.getAppPath());
  console.log("   __dirname :", __dirname);

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});