import { remote, ipcRenderer } from 'electron';
import * as $ from 'jquery';
import * as _ from 'lodash';
import { IConfigStore } from './configstore';
import { IGeneralThresholds } from './constants';
import * as util from './util';
import { processVideoWithoutOpenPose } from './runPython';

export default function settings(
	videoPlayer: HTMLVideoElement,
	configStore: IConfigStore,
	videoControl: any,
	diagram: any
) {
	// Refreshes settings when the user decides not to save.
	function refreshSettings() {
		let epochThresholdData = configStore.getEpochThresholdData();
		for (let key in epochThresholdData) {
			$('#' + key + '-setting').val(epochThresholdData[key]);
		}

		let directoryPaths = configStore.getDirectoryPaths();
		for (let key in directoryPaths) {
			$('#' + _.snakeCase(key) + '-value').text(directoryPaths[key]);
		}
	}

	// The animation for closing the settings menu.
	function exitSettings() {
		let settingsContent = $('#settings-content');
		settingsContent.animate(
			{ top: '50vh', opacity: '0%' },
			{
				duration: 500,
				complete: () => {
					util.toggleElementVisibility(settingsContent, false);
					refreshSettings();
				},
			}
		);
	}

	// Checks whether the new settings are valid then writing to the configStore.
	function saveSettings() {
		let newSettings: any = {};
		let hasEpochandThresholdChanged = false;
		function saveEpochAndThresholdSettings() {
			let epochThresholdData = configStore.getEpochThresholdData();
			let threshold: IGeneralThresholds = {};
			for (let key in epochThresholdData) {
				let setting = $('#' + key + '-setting').val() as string;
				let settingNum = Number(setting);
				if (Number.isNaN(settingNum)) {
					throw new Error('Please enter numbers only');
				}
				if (settingNum <= 0) {
					throw new Error('Please enter positive numbers only');
				}
				if (key === 'epochLength') {
					if (settingNum > videoPlayer.duration) {
						throw new Error(
							'The Epoch Length must be shorter than the video duration'
						);
					}
					hasEpochandThresholdChanged =
						hasEpochandThresholdChanged ||
						epochThresholdData.epochLength != settingNum;
					newSettings = { epochLength: setting };
				} else {
					hasEpochandThresholdChanged =
						hasEpochandThresholdChanged ||
						epochThresholdData[key] !== settingNum;
					threshold[key] = settingNum;
				}
			}
			newSettings = _.assign(newSettings, { threshold });
		}

		function saveDirectorySettings() {
			let directoryPaths = configStore.getDirectoryPaths();
			let paths: any = {};
			for (let key in directoryPaths) {
				let setting = _.trim($('#' + _.snakeCase(key) + '-value').text());
				paths[key] = setting;
			}

			newSettings = _.assign(newSettings, paths);
		}
		saveEpochAndThresholdSettings();
		saveDirectorySettings();
		configStore.saveData(newSettings);
		return hasEpochandThresholdChanged;
	}

	// Inserts the setting menu into the document body.
	function init() {
		initEpochThresholdSettings();
		initSettingsButton();
		initCloseSettingButton();
		initCloseSettingsWhenClickedBackground();
		initSaveButton();
		initEpochThresholdToggle();
		initDirectoryToggle();
		initMainMenuButton();
		initDirectorySettings();
	}

	function initEpochThresholdSettings() {
		let epochThresholdData = configStore.getEpochThresholdData();
		let mutableSettingsList = [];
		let epochThresholdSettings = $('#epoch-threshold-settings');

		for (let key in epochThresholdData) {
			mutableSettingsList.push(`
			<div style="flex: 1; align-items: center;">
				<label style="font-size: 1.5vmin; text-align: center;">${
					key == 'epochLength' ? 'Epoch Length' : key
				}: </label>
				<input
					id="${key}-setting"
					style="text-align: center; font-size: 1vw; height: 3vh; width: 7vw; outline: none; border: none; border-bottom: 1px solid black;"
					type="text"
					value="${epochThresholdData[key]}"
				/>
			</div>
		`);
		}
		mutableSettingsList.map((i) => {
			epochThresholdSettings.append(i);
		});
	}

	function initSettingsButton() {
		let settingsButton = $('#settings-btn');
		let settingsContent = $('#settings-content');
		settingsButton.click(() => {
			settingsContent.css({ display: 'flex', top: '50vh', opacity: '0%' });
			settingsContent.animate({ top: '25vh', opacity: '100%' }, 500);
			refreshSettings();
		});
	}

	function initCloseSettingButton() {
		let closeButton = $('#close-btn');
		closeButton.click(exitSettings);
	}

	function initCloseSettingsWhenClickedBackground() {
		let contentWrapper = $('#content-wrapper');
		contentWrapper.click(exitSettings);
	}

	function initSaveButton() {
		let saveSettingsButton = $('#save-btn');
		saveSettingsButton.click(async () => {
			try {
				videoControl.pauseVideoIfPlaying();
				const didEpochAndThresholdChange = saveSettings();
				videoControl.loadVideos();
				exitSettings();
				if (didEpochAndThresholdChange) {
					ipcRenderer.invoke('close-all-windows');
					util.turnOnLoadingScreen();
					await processNewVideoSettings();
					notifyProcessNewSettings();
				}
				diagram.refreshCanvas();
			} catch (error) {
				remote.dialog.showErrorBox(error.message, 'Please Try Again');
			}
		});
	}

	async function processNewVideoSettings() {
		let epochLength: number = configStore.get('epochLength');
		let thresholds: IGeneralThresholds = configStore.get('thresholds');
		let openPoseOptions = {
			epochLength,
			headThreshold: thresholds.Head,
			armsThreshold: thresholds.Arms,
			legsThreshold: thresholds.Legs,
			feetThreshold: thresholds.Feet,
		};
		const res = await processVideoWithoutOpenPose(openPoseOptions);
		util.turnOffLoadingScreen();
		if (res) {
			const videoData = util.processRawData(res);
			configStore.set('videoData', videoData);
			util.updateFile(configStore);
		} else {
			throw new Error(
				'Please check if the processing_script.exe file is missing and relaunch the application.'
			);
		}
	}

	function notifyProcessNewSettings() {
		new Notification('HMovements', {
			body: 'New Settings Processed.',
		});
	}

	function initEpochThresholdToggle() {
		let epochThresholdToggle = $('#epoch-threshold-toggle');
		let epochThresholdSettings = $('#epoch-threshold-settings');
		let directoryToggle = $('#directory-toggle');
		let directorySettings = $('#directory-settings');
		epochThresholdToggle.click(function () {
			if (!$(this).data('toggle')) {
				toggleEpochThresholdButtons($(this), true, epochThresholdSettings);
				toggleEpochThresholdButtons(directoryToggle, false, directorySettings);
			}
		});
	}

	function initDirectoryToggle() {
		let directoryToggle = $('#directory-toggle');
		let directorySettings = $('#directory-settings');
		let epochThresholdToggle = $('#epoch-threshold-toggle');
		let epochThresholdSettings = $('#epoch-threshold-settings');
		directoryToggle.click(function () {
			if (!$(this).data('toggle')) {
				toggleEpochThresholdButtons($(this), true, directorySettings);
				toggleEpochThresholdButtons(
					epochThresholdToggle,
					false,
					epochThresholdSettings
				);
			}
		});
	}

	function toggleEpochThresholdButtons(
		button: JQuery<HTMLElement>,
		toggleOn: boolean,
		content: JQuery<HTMLElement>
	) {
		let color: string = '#ebebeb';
		let display: string = 'flex';
		if (!toggleOn) {
			color = 'black';
			display = 'none';
		}
		button.data({ toggle: toggleOn });
		button.css({ color, 'border-color': color });
		content.css({ display });
	}

	function initMainMenuButton() {
		let mainMenuButton = $('#main-menu-btn');
		mainMenuButton.click(() => {
			let dialogOptions = {
				message: 'Are you sure you want to return to Main Menu?',
				buttons: ['Ok', 'Cancel'],
			};
			ipcRenderer.invoke('alert-message', dialogOptions).then((res) => {
				if (res.response === 0) document.location.reload();
			});
		});
	}

	function initDirectorySettings() {
		let directoryData: any = configStore.getDirectoryPaths();
		let directorySettings = $('#directory-settings');
		for (let key in directoryData) {
			let dirID = _.snakeCase(key);
			let settingName = _.startCase(key);
			let settingId = dirID + '-value';
			let settingValue = directoryData[key];
			let editSettingId = 'edit-' + dirID;
			directorySettings.append(
				`<div style="flex: 1; align-items: center;">
					<label style="font-size: 1.5vmin; text-align: center;">${settingName}: </label>
					<br />
					<div style="display: flex;">
						<span class="directory-paths" id="${settingId}">
							${settingValue}
						</span>
						<img id="${editSettingId}" class="dim" style="cursor: pointer;" src="images/link.svg" />
					</div>
				</div>`
			);

			$('#edit-' + dirID).click(() => {
				remote.dialog
					.showOpenDialog(remote.getCurrentWindow(), {
						properties: ['openFile'],
						filters: [{ name: 'Videos', extensions: ['mp4', 'webm'] }],
					})
					.then((result) => {
						if (result.canceled === false) {
							const path = result.filePaths[0];
							$('#' + dirID + '-value').text(path);
						}
					})
					.catch((err) => {
						console.error(err);
					});
			});
		}
	}

	return {
		init,
		refreshSettings,
		saveSettings,
	};
}
