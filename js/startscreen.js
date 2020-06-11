const { remote } = require('electron');
const { fps } = require('./constants');
const util = require('./util');
const ConfigStore = require('./configstore');
exports.init = function (pythonScript, initialize) {
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
			initLoadingScreen(savePath);
			pythonScript((err, data) => {
				util.processNewFile(err, data, initialize);
			});
			configStore = new ConfigStore(localStorage.getItem('videoPath'), savePath, bodyPartsThreshold, epochLength);
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
						localStorage.getItem('savePath'),
						configFile.bodyPartsThreshold,
						configFile.epochLength
					);
					$('#input_screen').css({ visibility: 'hidden' });
					initialize();
				}
			}
		});
	});
};

function initLoadingScreen(savePath, videoPlayer) {
	videoPlayer.src = localStorage.getItem('videoPath');
	videoPlayer.load();
	var interval = setInterval(() => {
		if (videoPlayer.readyState >= 3) {
			var interval2 = setInterval(() => {
				const numFiles = util.filesSoFar(savePath + '/json');
				const per = Math.round((numFiles / (fps * videoPlayer.duration)) * 10000) / 100;
				$('#load_percentage').text(per + '%');
				if (per === 1) {
					clearInterval(interval2);
					$('#load_percentage').text('');
				}
			}, 2000);
			clearInterval(interval);
		}
	}, 500);
}
