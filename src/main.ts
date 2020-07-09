import { app, BrowserWindow, Menu, ipcMain, dialog } from 'electron';
import * as path from 'path';
function createWindow() {
	// Create the browser window.
	const win: BrowserWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			nodeIntegration: true,
			devTools: true,
		},
	});

	// and load the index.html of the app.
	win.setMenuBarVisibility(false);
	win.loadFile(path.join(__dirname, '../index.html'));
	win.maximize();
	// Open the DevTools.
	win.webContents.openDevTools();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

ipcMain.handle('initialize-menu', (event, arg) => {
	const win: BrowserWindow | null = BrowserWindow.getFocusedWindow();
	if (win) {
		const template: Electron.MenuItemConstructorOptions[] = [
			{
				label: 'Tools',
				submenu: [
					{
						label: 'De-identification',
						click: () => win.webContents.send('deidentify'),
					},
				],
			},
		];
		win.setMenuBarVisibility(true);
		const menu = Menu.buildFromTemplate(template);
		Menu.setApplicationMenu(menu);
	}
});
