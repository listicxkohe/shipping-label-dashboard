// main.js
const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const {
  listFileMetadata,
  downloadFile,
  deleteRemoteFile,
} = require('./driveConnector');
const printer = require('./printerManager');
const settingsMgr = require('./settingsManager');

let mainWindow, settingsWindow;

function createWindow() {
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1200, height: 800,
    frame: false, transparent: true, backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname,'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: false
    }
  });
  mainWindow.loadFile(path.join(__dirname,'index.html'));

  mainWindow.webContents.on('did-finish-load', () => {
    refreshAndPush();
    setInterval(refreshAndPush, 15000);
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', ()=>{ if(process.platform!=='darwin') app.quit(); });

async function refreshAndPush(){
  try {
    const files = await listFileMetadata();
    mainWindow.webContents.send('files-list', files);
  } catch {
    mainWindow.webContents.send('files-list', []);
  }
}

// — Window controls —
ipcMain.on('window-minimize', ()=> mainWindow.minimize());
ipcMain.on('window-close',    ()=> mainWindow.close());

// — Print All w/ progress —
ipcMain.handle('print-all', async (_e, files)=>{
  const s = settingsMgr.loadSettings();
  const preview = s.preview;
  const total = files.length;
  for(let i=0;i<total;i++){
    const f = files[i];
    const local = await downloadFile(f.id, f.name);
    await printer.printOne(local, {
      preview,
      fit: s.fit,
      orientation: s.orientation,
      printer: s.printer,
      paperSize: s.paperSize,
      copies: s.copies,
      duplex: s.duplex
    });
    mainWindow.webContents.send('print-progress',{completed:i+1,total});
  }
});

// — Print Selected w/ progress —
ipcMain.handle('print-selected', async (_e, files)=>{
  const s = settingsMgr.loadSettings();
  const preview = s.preview;
  const total = files.length;
  for(let i=0;i<total;i++){
    const f = files[i];
    const local = await downloadFile(f.id, f.name);
    await printer.printOne(local, {
      preview,
      fit: s.fit,
      orientation: s.orientation,
      printer: s.printer,
      paperSize: s.paperSize,
      copies: s.copies,
      duplex: s.duplex
    });
    mainWindow.webContents.send('print-progress',{completed:i+1,total});
  }
});

// — Delete handlers unchanged —
ipcMain.handle('delete-file', async (_e, file)=>{
  await deleteRemoteFile(file.id);
  mainWindow.webContents.send('file-deleted', file.id);
});
ipcMain.handle('delete-all', async (_e, files)=>{
  for(const f of files){
    await deleteRemoteFile(f.id);
    mainWindow.webContents.send('file-deleted', f.id);
  }
});

// — Settings window & handlers unchanged… —
ipcMain.on('open-print-settings', ()=>{
  if(settingsWindow) return;
  settingsWindow = new BrowserWindow({
    parent: mainWindow, modal: true,
    width: 400, height: 700,
    frame: false, transparent: true,
    webPreferences:{
      preload: path.join(__dirname,'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  settingsWindow.loadFile(path.join(__dirname,'printSettings.html'));
  settingsWindow.on('closed',()=>{settingsWindow=null;});
});

ipcMain.handle('get-print-settings',()=> settingsMgr.loadSettings());
ipcMain.handle('save-print-settings',(_e,s)=> settingsMgr.saveSettings(s));
ipcMain.handle('get-printers',()=> printer.listPrinters());

// — Drive test & refresh unchanged… —
ipcMain.handle('refresh-files', async ()=> {
  try { return await listFileMetadata(); } catch { return []; }
});
ipcMain.handle('test-drive-connection', async ()=> {
  try { await listFileMetadata(); return {connected:true}; }
  catch { return {connected:false}; }
});

ipcMain.handle('update-credentials',async ()=>{ console.log('update-creds'); });
