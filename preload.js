// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  minimize:            () => ipcRenderer.send('window-minimize'),
  close:               () => ipcRenderer.send('window-close'),
  getFileList:         () => ipcRenderer.invoke('refresh-files'),
  onFileList:          cb => ipcRenderer.on('files-list', (_e, files) => cb(files)),
  testDriveConnection: () => ipcRenderer.invoke('test-drive-connection'),
  printFile:           (file, preview) => ipcRenderer.invoke('print-file', file, preview),
  printAll:            (files, preview) => ipcRenderer.invoke('print-all', files, preview),
  deleteFile:          file => ipcRenderer.invoke('delete-file', file),
  deleteAll:           files => ipcRenderer.invoke('delete-all', files),
  onFileDeleted:       cb => ipcRenderer.on('file-deleted', (_e, id) => cb(id)),
  updateCredentials:   () => ipcRenderer.invoke('update-credentials'),
});
