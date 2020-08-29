import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
let win: BrowserWindow | null = null;
function createWindow() {
	// Create the browser window.
	win = new BrowserWindow({
		width: 1600,
		height: 900,
		webPreferences: {
			nodeIntegration: true,
		},
	});

	// and load the index.html of the app.
	win.loadFile(path.join(__dirname, '../index.html'));
	win.maximize();
	win.setMenu(null);
	// Open the DevTools.
	win.on('close', () => {
		app.quit();
	});
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

const diagramWindows: {
	[Key: string]: BrowserWindow | null;
} = {};

ipcMain.handle('create-diagram-window', createDiagramWindow);

function createDiagramWindow(event: any, arg: any) {
	let winName = Object.keys(arg[0])[0];

	if (!diagramWindows[winName]) {
		const window: BrowserWindow = new BrowserWindow({
			height: 600,
			width: 800,
			title: arg[0].name,
			webPreferences: {
				nodeIntegration: true,
			},
		});
		diagramWindows[winName] = window;

		window.setMenu(null);
		window.loadFile('diagram.html').then(() => {
			window.webContents.send('initialize-diagram', arg);
		});
		window.on('close', () => {
			diagramWindows[winName] = null;
		});
	} else {
		dialog.showErrorBox('Warning', 'Window is already opened.');
	}
}

ipcMain.handle('send-timestamp', sendUpdatedTimestampToDiagramWindows);

function sendUpdatedTimestampToDiagramWindows(event: any, arg: any) {
	for (let key in diagramWindows) {
		let win: BrowserWindow | null | undefined = diagramWindows[key];
		if (win) {
			win.webContents.send('reply-timestamp', arg);
		}
	}
}

ipcMain.handle('close-all-windows', closeAllDiagramWindows);

function closeAllDiagramWindows(event: any, arg: any) {
	for (let key in diagramWindows) {
		let win: BrowserWindow | null | undefined = diagramWindows[key];
		if (win) {
			win.close();
			diagramWindows[key] = null;
		}
	}
}

ipcMain.handle('alert-message', sendAlertMessage);

function sendAlertMessage(event: any, arg: any) {
	let messageBoxOptions: Electron.MessageBoxOptions = {
		title: 'HMovements',
		message: '',
	};

	messageBoxOptions = { ...messageBoxOptions, ...arg };
	if (win !== null) {
		return dialog.showMessageBox(win, messageBoxOptions).then((res) => {
			return res;
		});
	}
}
