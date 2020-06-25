import { remote } from 'electron';
import * as $ from 'jquery';
import * as _ from 'lodash';
import type ConfigStore from './configstore';
import { IGeneralThresholds } from './constants';

export default function settings(pythonScript: Function, videoPlayer: HTMLVideoElement, configStore: ConfigStore) {
	// Refreshes settings when the user decides not to save.
	function refreshSettings() {
		let settings = configStore.mutableData;
		for (let key in settings) {
			$('#' + key + '_setting').val(settings[key]);
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
		let settings = configStore.mutableData;
		let newSettings: any = {};
		let threshold: IGeneralThresholds = {};
		for (let key in settings) {
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
				newSettings = { epochLength: setting };
			} else {
				threshold[key] = settingNum;
			}
		}
		newSettings = _.assign(newSettings, { threshold });
		configStore.saveData(newSettings);
	}

	// Inserts the setting menu into the document body.
	function init() {
		let settings = configStore.mutableData;
		let mutableSettingsList = [];
		for (let key in settings) {
			mutableSettingsList.push(`
			<div style="flex: 1; align-items: center;">
				<label style="font-size: 1vw; text-align: center;">${key == 'epochLength' ? 'Epoch Length' : key}: </label>
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
			$('#settings_container').append(i);
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
				saveSettings();
				exitSettings();
				$('#loading').css({ visibility: 'visible' });
				$('#main_content').css({ visibility: 'hidden' });
				pythonScript();
			} catch (error) {
				remote.dialog.showErrorBox(error.message, 'Please Try Again');
			}
		});
	}

	return {
		init,
		refreshSettings,
		saveSettings,
	};
}
