// main.js
const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const {
  listFileMetadata,
  downloadFile,
  deleteRemoteFile
} = require('./driveConnector');
const printer     = require('./printerManager');
const settingsMgr = require('./settingsManager');

let mainWindow;
let cancelPrinting = false;

function createWindow() {
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1200, height: 800,
    frame: false, transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.webContents.on('did-finish-load', () => {
    refreshAndPush();
    setInterval(refreshAndPush, 15000);
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
  } catch (e) {
    console.error('[main] refresh error', e);
    mainWindow.webContents.send('files-list', []);
  }
}

// Window controls
ipcMain.on('window-minimize', () => mainWindow.minimize());
ipcMain.on('window-close',    () => mainWindow.close());

// Manual refresh
ipcMain.handle('refresh-files', async () => {
  try { return await listFileMetadata(); }
  catch { return []; }
});

// Drive connection status
ipcMain.handle('test-drive-connection', async () => {
  try { await listFileMetadata(); return { connected: true }; }
  catch { return { connected: false }; }
});

// Persist / retrieve preview setting
ipcMain.handle('get-print-settings', () => settingsMgr.loadSettings());
ipcMain.handle('save-print-settings', (_e, s) => settingsMgr.saveSettings(s));

// Single-file print (swallows errors silently)
ipcMain.handle('print-file', async (_e, file) => {
  const s = settingsMgr.loadSettings();
  const local = await downloadFile(file.id, file.name);
  try {
    await printer.printOne(local, { preview: s.preview });
  } catch {
    // no-op
  }
});

// Cancel ongoing print
ipcMain.on('cancel-print', () => {
  cancelPrinting = true;
});

// Print All with progress + cancel support
ipcMain.handle('print-all', async (_e, files) => {
  cancelPrinting = false;
  const s = settingsMgr.loadSettings();
  const total = files.length;

  for (let i = 0; i < total; i++) {
    if (cancelPrinting) break;
    const f = files[i];
    const local = await downloadFile(f.id, f.name);
    try {
      await printer.printOne(local, { preview: s.preview });
    } catch {
      /* swallowed in printerManager */
    }
    mainWindow.webContents.send('print-progress', { completed: i + 1, total });
  }

  if (cancelPrinting) {
    mainWindow.webContents.send('print-cancelled');
  }
});

// Print Selected with progress + cancel support
ipcMain.handle('print-selected', async (_e, files) => {
  cancelPrinting = false;
  const s = settingsMgr.loadSettings();
  const total = files.length;

  for (let i = 0; i < total; i++) {
    if (cancelPrinting) break;
    const f = files[i];
    const local = await downloadFile(f.id, f.name);
    try {
      await printer.printOne(local, { preview: s.preview });
    } catch {
      /* swallowed in printerManager */
    }
    mainWindow.webContents.send('print-progress', { completed: i + 1, total });
  }

  if (cancelPrinting) {
    mainWindow.webContents.send('print-cancelled');
  }
});

// Deletion handlers
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

// Update Credentials stub
ipcMain.handle('update-credentials', async () => {
  console.log('[main] update-credentials clicked');
});
