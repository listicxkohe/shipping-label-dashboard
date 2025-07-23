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
  // Hide default menu
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    transparent: true,              // make the window itself transparent
    backgroundColor: '#00000000',    // fully transparent
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: false,
    },
  });

  // Load your index.html by absolute path
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
  } catch (err) {
    console.error('refreshAndPush error', err);
    mainWindow.webContents.send('files-list', []);
  }
}

// IPC handlers

ipcMain.on('window-minimize', () => mainWindow.minimize());
ipcMain.on('window-close',    () => mainWindow.close());

ipcMain.handle('refresh-files', async () => {
  try { return await listFileMetadata(); }
  catch { return []; }
});

ipcMain.handle('test-drive-connection', async () => {
  try { await listFileMetadata(); return { connected: true }; }
  catch { return { connected: false }; }
});

ipcMain.handle('print-file', async (_e, file, preview) => {
  const local = await downloadFile(file.id, file.name);
  await printer.printOne(local, preview);
});

ipcMain.handle('print-all', async (_e, files, preview) => {
  for (const f of files) {
    const p = await downloadFile(f.id, f.name);
    await printer.printOne(p, preview);
  }
});

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

ipcMain.handle('update-credentials', async () => {
  console.log('[main] update-credentials clicked');
});
