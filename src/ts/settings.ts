import { remote, ipcRenderer } from 'electron';
import * as $ from 'jquery';
import * as _ from 'lodash';
import type ConfigStore from './configstore';
import { IGeneralThresholds, epochLength } from './constants';

export default function settings(pythonScript: Function, videoPlayer: HTMLVideoElement, configStore: ConfigStore, videoControl: any) {
	// Refreshes settings when the user decides not to save.
	function refreshSettings() {
		let settings = configStore.epochThresholdData;
		for (let key in settings) {
			$('#' + key + '_setting').val(settings[key]);
		}
		let currentConfig: any = configStore.directoryData;
		for (let key in currentConfig) {
			$('#' + _.snakeCase(key) + '_value').text(currentConfig[key]);
		}
	}

	// The animation for closing the settings menu.
	function exitSettings() {
		$('#settings_content').animate(
			{ top: '50vh', opacity: '0%' },
			{
				duration: 500,
				complete: () => {
					$('#settings_content').css({ display: 'none' });
				},
			}
		);
		refreshSettings();
	}

	// Checks whether the new settings are valid then writing to the configStore.
	function saveSettings() {
		let newSettings: any = {};
		let hasEpochandThresholdChanged = false;
		function saveEpochAndThresholdSettings() {
			let currentConfig = configStore.epochThresholdData;
			let threshold: IGeneralThresholds = {};
			for (let key in currentConfig) {
				let setting = $('#' + key + '_setting').val() as string;
				let settingNum = Number(setting);
				if (Number.isNaN(settingNum)) {
					throw new Error('Please enter numbers only');
				}
				if (settingNum <= 0) {
					throw new Error('Please enter positive numbers only');
				}
				if (key === 'epochLength') {
					if (settingNum > videoPlayer.duration) {
						throw new Error('The Epoch Length must be shorter than the video duration');
					}
					hasEpochandThresholdChanged = hasEpochandThresholdChanged || currentConfig.epochLength != settingNum;
					newSettings = { epochLength: setting };
				} else {
					hasEpochandThresholdChanged = hasEpochandThresholdChanged || currentConfig[key] !== settingNum;
					threshold[key] = settingNum;
				}
			}
			newSettings = _.assign(newSettings, { threshold });
		}

		function saveDirectorySettings() {
			let currentConfig = configStore.directoryData;
			let paths: any = {};
			for (let key in currentConfig) {
				let setting = _.trim($('#' + _.snakeCase(key) + '_value').text());
				paths[key] = setting;
			}

			newSettings = _.assign(newSettings, paths);
		}
		saveEpochAndThresholdSettings();
		saveDirectorySettings();
		configStore.saveData(newSettings);
		videoControl.loadVideos();
		return hasEpochandThresholdChanged;
	}

	// Inserts the setting menu into the document body.
	function init() {
		let settings = configStore.epochThresholdData;
		let mutableSettingsList = [];
		for (let key in settings) {
			mutableSettingsList.push(`
			<div style="flex: 1; align-items: center;">
				<label style="font-size: 1.5vmin; text-align: center;">${key == 'epochLength' ? 'Epoch Length' : key}: </label>
				<input
					id="${key}_setting"
					style="text-align: center; font-size: 1vw; height: 3vh; width: 7vw; outline: none; border: none; border-bottom: 1px solid black;"
					type="text"
					value="${settings[key]}"
				/>
			</div>
		`);
		}
		mutableSettingsList.map((i) => {
			$('#epoch_threshold_settings').append(i);
		});

		$('#settings_btn').click(() => {
			$('#settings_content').css({ display: 'flex', top: '50vh', opacity: '0%' });
			$('#settings_content').animate({ top: '25vh', opacity: '100%' }, 500);
			refreshSettings();
		});

		$('#close_btn').click(exitSettings);

		$('#content_wrapper').click(exitSettings);

		$('#save_btn').click(() => {
			try {
				const didEpochAndThresholdChange = saveSettings();
				exitSettings();
				if (didEpochAndThresholdChange) {
					ipcRenderer.invoke('close-all-windows');
					$('#loading').css({ visibility: 'visible' });
					$('#main_content').css({ visibility: 'hidden' });
					pythonScript();
				}
			} catch (error) {
				remote.dialog.showErrorBox(error.message, 'Please Try Again');
			}
		});

		$('#epoch_threshold_toggle').click(function () {
			if (!$(this).data('toggle')) {
				toggle($(this), true, $('#epoch_threshold_settings'));
				toggle($('#directory_toggle'), false, $('#directory_settings'));
			}
		});

		$('#directory_toggle').click(function () {
			if (!$(this).data('toggle')) {
				toggle($(this), true, $('#directory_settings'));
				toggle($('#epoch_threshold_toggle'), false, $('#epoch_threshold_settings'));
			}
		});

		const toggle = function (button: JQuery<HTMLElement>, toggleOn: boolean, content: JQuery<HTMLElement>) {
			let color: string = '#ebebeb';
			let display: string = 'flex';
			if (!toggleOn) {
				color = 'black';
				display = 'none';
			}
			button.data({ toggle: toggleOn });
			button.css({ color, 'border-color': color });
			content.css({ display });
		};

		let directoryData: any = configStore.directoryData;
		for (let key in directoryData) {
			let dirID = _.snakeCase(key);
			$('#directory_settings').append(
				`<div style="flex: 1; align-items: center;">
					<label style="font-size: 1.5vmin; text-align: center;">${_.startCase(key)}: </label>
					<br />
					<div style="display: flex;">
						<span class="directory_paths" id="${dirID}_value">
							${directoryData[key]}
						</span>
						<img id="edit_${dirID}" class="dim" style="cursor: pointer;" src="images/link.svg" />
					</div>
				</div>`
			);

			$('#edit_' + dirID).click(() => {
				remote.dialog
					.showOpenDialog(remote.getCurrentWindow(), {
						properties: ['openFile'],
						filters: [{ name: 'Videos', extensions: ['mp4'] }],
					})
					.then((result) => {
						if (result.canceled === false) {
							const path = result.filePaths[0];
							$('#' + dirID + '_value').text(path);
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
