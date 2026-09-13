const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;
let mainWindow;
let customerWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 950,
    minWidth: 1180,
    minHeight: 720,
    backgroundColor: '#080b12',
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false }
  });
  mainWindow.loadURL(isDev ? 'http://localhost:5173' : `file://${path.join(__dirname, '../dist/index.html')}`);
}

function createCustomerDisplay(displayId) {
  if (customerWindow && !customerWindow.isDestroyed()) { customerWindow.focus(); return; }
  const target = screen.getAllDisplays().find(d => d.id === Number(displayId)) || screen.getPrimaryDisplay();
  customerWindow = new BrowserWindow({ x: target.bounds.x, y: target.bounds.y, width: target.bounds.width, height: target.bounds.height, fullscreen: true, frame: false, backgroundColor: '#080b12', webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false } });
  customerWindow.loadURL(isDev ? 'http://localhost:5173?display=customer' : `file://${path.join(__dirname, '../dist/index.html')}?display=customer`);
  customerWindow.on('closed', () => { customerWindow = null; });
}

function printerList() {
  return mainWindow?.webContents?.getPrintersAsync().then(printers => printers.map(p => ({ name: p.name, displayName: p.displayName, description: p.description || '', status: p.status, isDefault: p.isDefault }))) || Promise.resolve([]);
}

function printHtml({ html, deviceName, silent = true, pageSize }) {
  const win = new BrowserWindow({ show: false, width: 800, height: 1000, webPreferences: { contextIsolation: true, nodeIntegration: false } });
  return new Promise((resolve, reject) => {
    win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    win.webContents.once('did-finish-load', () => {
      win.webContents.print({ silent, deviceName: deviceName || undefined, printBackground: true, pageSize: pageSize || undefined }, success => {
        win.close();
        if (success) resolve(true); else reject(new Error('Printer did not accept the job.'));
      });
    });
    win.webContents.once('did-fail-load', () => { win.close(); reject(new Error('Could not prepare print job.')); });
  });
}

app.whenReady().then(() => {
  createMainWindow();
  ipcMain.handle('system:displays', () => screen.getAllDisplays().map(d => ({ id: d.id, bounds: d.bounds, scaleFactor: d.scaleFactor })));
  ipcMain.handle('display:open', (_, id) => { createCustomerDisplay(id); return true; });
  ipcMain.handle('display:close', () => { if (customerWindow && !customerWindow.isDestroyed()) customerWindow.close(); return true; });
  ipcMain.handle('app:version', () => app.getVersion());
  ipcMain.handle('printers:list', () => printerList());
  ipcMain.handle('printer:print', (_, payload) => printHtml(payload));
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createMainWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
