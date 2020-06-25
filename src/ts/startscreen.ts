import { remote } from 'electron';
import { fps, generalThresholds, epochLength } from './constants';
import * as util from './util';
import ConfigStore from './configstore';
import * as $ from 'jquery';

export default function startscreen(pythonScript: Function, initialize: Function, videoPlayer: HTMLVideoElement) {
	// Initializes the startscreen by setting up the event handler functions for the buttons.
	function init() {
		let configStore: ConfigStore | null = null;
		window.onbeforeunload = function () {
			localStorage.clear();
		};
		$('#input_btn').click(() => {
			remote.dialog
				.showOpenDialog({
					properties: ['openFile'],
					filters: [{ name: 'Videos', extensions: ['mp4'] }],
				})
				.then((result) => {
					if (result.canceled === false) {
						const path = result.filePaths[0];
						$('#upload_text').text(path);
						localStorage.setItem('videoPath', path);
					}
				})
				.catch((err) => {
					console.error(err);
				});
		});

		$('#dest_btn').click(() => {
			remote.dialog
				.showOpenDialog({ properties: ['openDirectory'] })
				.then((result) => {
					if (result.canceled === false) {
						const path = result.filePaths[0];
						const count = util.filesSoFar(path);
						if (count === 0) {
							$('#save_text').text(path);
							localStorage.setItem('savePath', path);
						} else {
							alert('Make sure the save folder is empty');
						}
					}
				})
				.catch((err) => {
					console.error(err);
				});
		});

		$('#continue_btn').click(() => {
			const savePath = localStorage.getItem('savePath');
			if (localStorage.getItem('videoPath') !== null && savePath !== null) {
				$('#input_screen').css({ visibility: 'hidden' });
				$('#loading').css({ visibility: 'visible' });
				configStore = new ConfigStore(localStorage.getItem('videoPath')!, savePath, generalThresholds, epochLength);
				initLoadingScreen(savePath, videoPlayer);
				pythonScript((err: Error, data: string) => {
					util.processNewFile(err, data, () => initialize(configStore));
				});
			} else {
				alert('Make sure you have uploaded a video and select the save location.');
			}
		});

		$('#import_btn').click(() => {
			remote.dialog.showOpenDialog({ properties: ['openDirectory'] }).then(async (result) => {
				if (result.canceled === false) {
					const path = result.filePaths[0];
					const configFile = util.importExistingFile(path);
					if (configFile) {
						configStore = new ConfigStore(
							configFile.videoPath,
							localStorage.getItem('savePath')!,
							configFile.bodyPartsThreshold,
							configFile.epochLength
						);
						$('#input_screen').css({ visibility: 'hidden' });
						initialize(configStore);
					}
				}
			});
		});
	}

	// Uses the filesSoFar function from util.ts to display the current progress so far.
	function initLoadingScreen(savePath: string, videoPlayer: HTMLVideoElement) {
		videoPlayer.src = localStorage.getItem('videoPath')!;
		videoPlayer.load();
		var interval = setInterval(() => {
			if (videoPlayer.readyState >= 3) {
				var interval2 = setInterval(() => {
					const numFiles = util.filesSoFar(savePath + '/json');
					const per = Math.round((numFiles / (fps * Math.floor(videoPlayer.duration))) * 10000) / 100;
					$('#load_percentage').text(per + '%');
					if (per >= 1) {
						clearInterval(interval2);
						$('#load_percentage').text('');
					}
				}, 2000);
				clearInterval(interval);
			}
		}, 500);
	}

	return {
		init,
	};
}
