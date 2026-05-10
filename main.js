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

// ── Graphics folder scanning (recursive) ────────────────
ipcMain.handle("scan-graphics", () => {
  const graphicsDir = path.join(__dirname, "assets", "graphics");
  if (!fs.existsSync(graphicsDir)) return [];
  const results = [];
  // Walk all subdirectories one level deep
  const entries = fs.readdirSync(graphicsDir, { withFileTypes: true });
  entries.forEach(entry => {
    if (entry.isDirectory()) {
      const category = entry.name; // folder name = category
      const subDir   = path.join(graphicsDir, category);
      try {
        fs.readdirSync(subDir).forEach(fname => {
          if (!/\.(svg|png|jpg|jpeg|webp)$/i.test(fname)) return;
          const fpath = path.join(subDir, fname);
          try {
            const buf  = fs.readFileSync(fpath);
            const ext  = fname.split(".").pop().toLowerCase();
            const mime = ext === "svg"
              ? "image/svg+xml"
              : ext === "png" ? "image/png"
              : ext === "webp" ? "image/webp"
              : "image/jpeg";
            const dataUrl = `data:${mime};base64,${buf.toString("base64")}`;
            results.push({
              name     : fname.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
              file     : category + "/" + fname,
              category,
              ext,
              dataUrl,
            });
          } catch(e) {}
        });
      } catch(e) {}
    } else {
      // Root-level files go to "general" category
      const fname = entry.name;
      if (!/\.(svg|png|jpg|jpeg|webp)$/i.test(fname)) return;
      try {
        const buf  = fs.readFileSync(path.join(graphicsDir, fname));
        const ext  = fname.split(".").pop().toLowerCase();
        const mime = ext === "svg" ? "image/svg+xml"
          : ext === "png" ? "image/png"
          : ext === "webp" ? "image/webp" : "image/jpeg";
        results.push({
          name    : fname.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
          file    : fname,
          category: "general",
          ext,
          dataUrl : `data:${mime};base64,${buf.toString("base64")}`,
        });
      } catch(e) {}
    }
  });
  return results;
});

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

// ── Background Removal ────────────────────────────────────
ipcMain.handle("remove-background", async (event, dataUrl) => {
  // Lazy-load to avoid startup cost
  const { removeBackground } = require("@imgly/background-removal-node"); // ✅ fixed typo

  // Extract raw bytes from the data URL
  const mimeMatch  = dataUrl.match(/^data:(image\/[^;]+);base64,/);
  const mimeType   = mimeMatch ? mimeMatch[1] : "image/png";
  const base64Data = dataUrl.replace(/^data:(image\/[^;]+);base64,/, "");
  const imgBuffer  = Buffer.from(base64Data, "base64"); // renamed to avoid any shadowing

  // Wrap in a Blob so the library can detect the image type
  const inputBlob = new Blob([imgBuffer], { type: mimeType }); // ✅ fixed double brackets [[]] → []

// Build the correct path to the bundled model files inside node_modules
  const modelDir = app.isPackaged
    ? path.join(process.resourcesPath, "app.asar.unpacked", "node_modules", "@imgly", "background-removal-node", "dist")
    : path.join(__dirname, "node_modules", "@imgly", "background-removal-node", "dist");

  // Process — output is always PNG with alpha channel
  const resultBlob = await removeBackground(inputBlob, {
    output: { format: "image/png", quality: 0.9, type: "foreground" },
    publicPath: `file://${modelDir}/`,
  });

  const resultBuffer = Buffer.from(await resultBlob.arrayBuffer());
  return `data:image/png;base64,${resultBuffer.toString("base64")}`;
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