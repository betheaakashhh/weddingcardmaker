const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1600,
    height: 1000,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "icon.ico"),

    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile("card-layout-studio-v3.html");
}

app.whenReady().then(createWindow);