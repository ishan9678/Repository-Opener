const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on('open-repo', (event, repoPath) => {
  exec(`code "${repoPath}" && start powershell -NoExit -Command "cd '${repoPath}'"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
});

ipcMain.on('start-server', (event, serverType) => {
  let startCommand;
  let checkCommand;

  switch (serverType) {
    case 'redis':
      startCommand = 'wsl -e redis-server'; 
      checkCommand = 'wsl -e redis-cli ping'; 
      break;
    default:
      console.error(`Unknown server type: ${serverType}`);
      event.reply('server-status', { type: serverType, status: 'error', message: `Unknown server type: ${serverType}` });
      return;
  }

  console.log(`Attempting to start ${serverType} server with command: ${startCommand}`);
  event.reply('server-status', { type: serverType, status: 'success', message: 'PONG' });


  exec(startCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      event.reply('server-status', { type: serverType, status: 'error', message: error.message });
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      event.reply('server-status', { type: serverType, status: 'error', message: stderr });
      return;
    }
  });
});
