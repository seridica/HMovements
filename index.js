const $ = require('jquery');
const _ = require('lodash');
const videoPlayer = $('#main_player')[0];
const skeletonPlayer = $('#skeleton_player')[0];
const partsTab = $('#partsTab');
const { pythonScript } = require('./js/runPython');
const util = require('./js/util');
const diagram = require('./js/diagrams');
const { remote, ipcRenderer } = require('electron');
const { bodyParts, bodyPartsThreshold, epochLength, fps } = require('./js/constants');
const ConfigStore = require('./js/configstore');
var configStore = null;
var canvasHtmls = [];
const initVideoPlayers = () => {
	const videoPath = localStorage.getItem('videoPath');
	const savePath = localStorage.getItem('savePath');
	videoPlayer.src = configStore.videoPath;
	skeletonPlayer.src = savePath + `/${util.getVideoName(videoPath)}.mp4`;
	videoPlayer.load();
	skeletonPlayer.load();
	const checkVideo = () => {
		var interval = setInterval(() => {
			if (videoPlayer.readyState >= 3) {
				$('#video_time').text(util.formatVideoTime(videoPlayer.currentTime) + ' / ' + util.formatVideoTime(videoPlayer.duration));
				$('#main_content').css({ visibility: 'visible' });
				$('#loading').css({ visibility: 'hidden' });
				clearInterval(interval);
			}
		}, 500);
	};
	checkVideo();
};

const initVideoControls = () => {
	$('#parts_btn').click(() => {
		partsTab.css('display') === 'none' ? partsTab.css({ display: 'block' }) : partsTab.css({ display: 'none' });
	});

	$('#play_btn').click(() => {
		videoPlayer.play();
		skeletonPlayer.play();
		videoPlayer.ontimeupdate = () => {
			const barWidth = $('#progress_bar_container').width();
			const percentage = videoPlayer.currentTime / videoPlayer.duration;
			$('#progress_bar').css({ width: percentage * barWidth });
			$('#video_time').text(util.formatVideoTime(videoPlayer.currentTime) + ' / ' + util.formatVideoTime(videoPlayer.duration));
			if (videoPlayer.ended) {
				$('#play_btn').css({ display: 'inline' });
				$('#pause_btn').css({ display: 'none' });
			}
		};
		$('#pause_btn').css({ display: 'inline' });
		$('#play_btn').css({ display: 'none' });
	});

	$('#pause_btn').click(() => {
		videoPlayer.pause();
		skeletonPlayer.pause();
		$('#play_btn').css({ display: 'inline' });
		$('#pause_btn').css({ display: 'none' });
	});

	var clicking = false;
	$('#progress_bar_container').mousedown((e) => {
		clicking = true;
		const barWidth = $('#progress_bar_container').width();
		const posX = (e.pageX - $('#progress_bar_container').offset().left) / barWidth;
		$('#progress_bar').css({ width: posX * barWidth });
		videoPlayer.currentTime = videoPlayer.duration * posX;
		skeletonPlayer.currentTime = videoPlayer.duration * posX;
		$('#video_time').text(util.formatVideoTime(videoPlayer.currentTime) + ' / ' + util.formatVideoTime(videoPlayer.duration));
	});

	$('#progress_bar_container').mousemove((e) => {
		if (clicking === true) {
			const barWidth = $('#progress_bar_container').width();
			const posX = (e.pageX - $('#progress_bar_container').offset().left) / barWidth;
			$('#progress_bar').css({ width: posX * barWidth });
			videoPlayer.currentTime = videoPlayer.duration * posX;
			skeletonPlayer.currentTime = videoPlayer.duration * posX;
			$('#video_time').text(util.formatVideoTime(videoPlayer.currentTime) + ' / ' + util.formatVideoTime(videoPlayer.duration));
		}
	});

	$('#progress_bar_container').mouseup(() => {
		clicking = false;
	});
};

const refreshCanvas = () => {
	bodyParts.forEach((part) => {
		const id = part.replace(' ', '');
		if ($('#' + id).data('toggle')) {
			$('#' + id).click();
		}
	});
	initDiagrams(true);
};

const initDiagrams = (isNewSettings = false) => {
	diagram.initializeCanvas();
	diagram.drawCanvas(configStore);

	if (isNewSettings === false) {
		const partsFolder = $('#parts_btn_folder');
		bodyParts.map((part) => {
			partsFolder.append(`<div id=${part.replace(' ', '')} data-toggle="false" class="dim, parts" >${part}</div>`);
		});
	}

	bodyParts.forEach((part) => {
		const id = part.replace(' ', '');
		let partDiagram = $('#' + id + '_diagram_container');
		let bodyHtml = partDiagram.detach();
		canvasHtmls.push(bodyHtml);
		$('#' + id).off('click');
		$('#' + id).click(function () {
			let color = '#ebebeb';
			$(this).data({ toggle: !$(this).data('toggle') });
			if (!$(this).data('toggle')) {
				color = 'black';
				partDiagram.detach();
			} else {
				bodyHtml.appendTo('#diagram_container');
			}
			$(this).css({ color, 'border-color': color });
		});
	});
};

const initOthers = () => {
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

	const refreshSettings = () => {
		let settings = configStore.mutableData;
		for (let key in settings) {
			$('#' + key + '_setting').val(settings[key]);
		}
	};

	const exitSettings = () => {
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
	};

	const saveSettings = () => {
		let settings = configStore.mutableData;
		let newSettings = {};
		let threshold = {};
		for (let key in settings) {
			let setting = $('#' + key + '_setting').val();
			if (isNaN(setting)) {
				throw new Error('Please enter numbers only');
			}
			if (parseFloat(setting) < 0) {
				throw new Error('Please enter positive numbers only');
			}
			if (key === 'epochLength') {
				if (setting > videoPlayer.duration) {
					throw new Error('The Epoch Length must be shorter than the video duration');
				}
				newSettings = { epochLength: setting };
			} else {
				threshold[key] = setting;
			}
		}
		newSettings = _.assign(newSettings, { threshold });
		configStore.saveData(newSettings);
	};

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
			pythonScript(util.processNewSetting, configStore.mutableData);
		} catch (error) {
			remote.dialog.showErrorBox(error.message, 'Please Try Again');
		}
	});
};

const initLoadingScreen = (savePath) => {
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
};

const initStartScreen = () => {
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
			pythonScript(util.processNewFile);
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

const initialize = () => {
	initVideoPlayers();
	initVideoControls();
	initDiagrams();
	initOthers();
};

initStartScreen();
