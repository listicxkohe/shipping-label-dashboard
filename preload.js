// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api',{
  minimize:            ()=> ipcRenderer.send('window-minimize'),
  close:               ()=> ipcRenderer.send('window-close'),
  getFileList:         ()=> ipcRenderer.invoke('refresh-files'),
  onFileList:          cb => ipcRenderer.on('files-list',(_e,f)=>cb(f)),
  printFile:           (file,preview)=> ipcRenderer.invoke('print-file',file,preview),
  printAll:            files=> ipcRenderer.invoke('print-all',files),
  printSelected:       files=> ipcRenderer.invoke('print-selected',files),
  onPrintProgress:     cb => ipcRenderer.on('print-progress',(_e,p)=>cb(p)),
  deleteFile:          file=> ipcRenderer.invoke('delete-file',file),
  deleteAll:           files=> ipcRenderer.invoke('delete-all',files),
  testDriveConnection: ()=> ipcRenderer.invoke('test-drive-connection'),
  openPrintSettings:   ()=> ipcRenderer.send('open-print-settings'),
  getPrintSettings:    ()=> ipcRenderer.invoke('get-print-settings'),
  savePrintSettings:   s=> ipcRenderer.invoke('save-print-settings',s),
  getPrinters:         ()=> ipcRenderer.invoke('get-printers'),
  updateCredentials:   ()=> ipcRenderer.invoke('update-credentials')
});
