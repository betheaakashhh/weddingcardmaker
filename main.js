
const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");
const { autoUpdater } = require("electron-updater");

let win;

app.whenReady().then(() => {
  console.log("App is ready. Starting initialization...");
  console.log("APP PATHS:", app.getAppPath());
  console.log("DIRNAME:", __dirname);
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
      preload: path.join(__dirname, "preload.js")
    }
  });

  win.loadFile("card-layout-studio-v3.html");
}

// 🔹 Auto update logic
function setupAutoUpdater() {
  // Disable updater in development mode
  if (!app.isPackaged) {
    console.log("Auto-update disabled in development mode.");
    return;
  }

  autoUpdater.on("checking-for-update", () => {
    console.log("Checking for update...");
  });

  autoUpdater.on("update-available", () => {
    console.log("Update available");
  });

  autoUpdater.on("update-not-available", () => {
    console.log("No updates available");
  });

  autoUpdater.on("download-progress", (progressObj) => {
    console.log(
      `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`
    );
  });

  autoUpdater.on("update-downloaded", () => {
    console.log("Update downloaded");
    autoUpdater.quitAndInstall();
  });

  autoUpdater.on("error", (error) => {
    console.error(
      "Auto-updater error:",
      error == null ? "unknown" : error.message
    );
  });

  autoUpdater.checkForUpdatesAndNotify().catch((error) => {
    console.error(
      "Update check failed:",
      error == null ? "unknown" : error.message
    );
  });
}

app.whenReady().then(() => {
  createWindow();
  setupAutoUpdater();

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

