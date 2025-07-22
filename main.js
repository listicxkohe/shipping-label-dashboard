// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const {
  listFileMetadata,
  downloadFile,
  deleteRemoteFile,
} = require('./driveConnector');
const printer = require('./printerManager');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,               // we draw our own title bar
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('index.html');
  mainWindow.webContents.openDevTools();

  mainWindow.webContents.on('did-finish-load', () => {
    refreshAndPush();
    setInterval(refreshAndPush, 15_000);
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

async function refreshAndPush() {
  try {
    const files = await listFileMetadata();
    mainWindow.webContents.send('files-list', files);
  } catch (err) {
    console.error('Error refreshing metadata:', err);
    mainWindow.webContents.send('files-list', []);
  }
}

// --- IPC Handlers ---

ipcMain.on('window-minimize', () => {
  mainWindow.minimize();
});

ipcMain.on('window-close', () => {
  mainWindow.close();
});

ipcMain.handle('refresh-files', async () => {
  try {
    return await listFileMetadata();
  } catch {
    return [];
  }
});

ipcMain.handle('print-file', async (_e, file, preview) => {
  const localPath = await downloadFile(file.id, file.name);
  await printer.printOne(localPath, preview);
});

ipcMain.handle('print-all', async (_e, files, preview) => {
  for (const file of files) {
    const p = await downloadFile(file.id, file.name);
    await printer.printOne(p, preview);
  }
});

ipcMain.handle('delete-file', async (_e, file) => {
  await deleteRemoteFile(file.id);
  mainWindow.webContents.send('file-deleted', file.id);
});

ipcMain.handle('delete-all', async (_e, files) => {
  for (const file of files) {
    await deleteRemoteFile(file.id);
    mainWindow.webContents.send('file-deleted', file.id);
  }
});

// Stub for future credentials update
ipcMain.handle('update-credentials', async () => {
  console.log('[main] update-credentials clicked');
  // TODO: implement credentials refresh flow
});
