// main.js
const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const {
  listFileMetadata,
  downloadFile,
  deleteRemoteFile,
} = require('./driveConnector');
const printer = require('./printerManager');

let mainWindow;

function createWindow() {
  Menu.setApplicationMenu(null); // hide default menu

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: false,
    },
  });

  mainWindow.loadFile('index.html');
  mainWindow.webContents.on('did-finish-load', () => {
    refreshAndPush();
    setInterval(refreshAndPush, 15_000);
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Poll & push metadata
async function refreshAndPush() {
  try {
    const files = await listFileMetadata();
    mainWindow.webContents.send('files-list', files);
  } catch (err) {
    console.error('Error in refreshAndPush:', err);
    mainWindow.webContents.send('files-list', []);
  }
}

// IPC handlers

ipcMain.on('window-minimize', () => mainWindow.minimize());
ipcMain.on('window-close',    () => mainWindow.close());

// Return metadata array
ipcMain.handle('refresh-files', async () => {
  try { return await listFileMetadata(); }
  catch (err) {
    console.error('Error in refresh-files:', err);
    return [];
  }
});

// Test drive connection
ipcMain.handle('test-drive-connection', async () => {
  try {
    await listFileMetadata(); // simply try listing
    return { connected: true };
  } catch (e) {
    console.error('Drive connection test failed:', e);
    return { connected: false, message: e.message };
  }
});

// Print / download on demand
ipcMain.handle('print-file', async (_e, file, preview) => {
  const localPath = await downloadFile(file.id, file.name);
  await printer.printOne(localPath, preview);
});
ipcMain.handle('print-all', async (_e, files, preview) => {
  for (const f of files) {
    const p = await downloadFile(f.id, f.name);
    await printer.printOne(p, preview);
  }
});

// Delete
ipcMain.handle('delete-file', async (_e, file) => {
  await deleteRemoteFile(file.id);
  mainWindow.webContents.send('file-deleted', file.id);
});
ipcMain.handle('delete-all', async (_e, files) => {
  for (const f of files) {
    await deleteRemoteFile(f.id);
    mainWindow.webContents.send('file-deleted', f.id);
  }
});

// Stub for credentials update
ipcMain.handle('update-credentials', async () => {
  console.log('[main] update-credentials clicked');
});
