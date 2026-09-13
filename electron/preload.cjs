const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('posDesktop', {
  getDisplays: () => ipcRenderer.invoke('system:displays'),
  openCustomerDisplay: (id) => ipcRenderer.invoke('display:open', id),
  closeCustomerDisplay: () => ipcRenderer.invoke('display:close'),
  version: () => ipcRenderer.invoke('app:version')
});
