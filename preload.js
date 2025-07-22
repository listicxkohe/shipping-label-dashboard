// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  close: () => ipcRenderer.send('window-close'),

  // Metadata listing
  getFileList: () => ipcRenderer.invoke('refresh-files'),
  onFileList: callback =>
    ipcRenderer.on('files-list', (_e, files) => callback(files)),

  // Printing
  printFile: (file, preview) =>
    ipcRenderer.invoke('print-file', file, preview),
  printAll: (files, preview) =>
    ipcRenderer.invoke('print-all', files, preview),

  // Deleting
  deleteFile: file =>
    ipcRenderer.invoke('delete-file', file),
  deleteAll: files =>
    ipcRenderer.invoke('delete-all', files),

  onFileDeleted: callback =>
    ipcRenderer.on('file-deleted', (_e, id) => callback(id)),

  // Options
  updateCredentials: () => ipcRenderer.invoke('update-credentials'),
});
