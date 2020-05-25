const $ = require('jquery');
const _ = require('lodash');
const video_player = $('#main_player')[0];
const skeleton_player = $('#skeleton_player')[0];
const parts_tab = $('#parts_tab');
const pythonScript = require('./js/runPython');
const { dialog } = require('electron').remote;
const body_parts = ['Head', 'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg', 'Left Foot', 'Right Foot'];

const initialize = () => {
	$('#parts_btn').click(() => {
		parts_tab.css('display') === 'none' ? parts_tab.css({ display: 'block' }) : parts_tab.css({ display: 'none' });
	});

	$('#play_btn').click(() => {
		video_player.play();
		skeleton_player.play();
		video_player.ontimeupdate = () => console.log(video_player.currentTime);
	});

	$('#pause_btn').click(() => {
		video_player.pause();
		skeleton_player.pause();
	});

	const parts_folder = $('#parts_folder');
	body_parts.map((part) => {
		parts_folder.append(`<div id=${part.replace(' ', '')} data-toggle="false" class="dim, parts" >${part}</div>`);
	});
	body_parts.forEach((part) => {
		const id = part.replace(' ', '');
		$('#' + id).click(function () {
			let color = '#ebebeb';
			let display = 'block';
			$(this).data({ toggle: !$(this).data('toggle') });
			if ($(this).data('toggle') === false) {
				display = 'none';
				color = 'black';
			}
			$(this).css({ color, 'border-color': color });
			const part_diagram = $('#' + id + '_diagram_container');
			part_diagram.css({ display });
			let count = 0;
			$('.parts').each(function () {
				if ($(this).data('toggle') === true) {
					count++;
				}
			});
		});
	});
	$.get('./static/diagrams.html', (data) => {
		$('#main_container').append(data);
	});
};

const initializeStartScreen = () => {
	window.onbeforeunload = function () {
		localStorage.clear();
	};
	$('#input_btn').click(() => {
		dialog
			.showOpenDialog({
				properties: ['openFile'],
				filters: [{ name: 'Videos', extensions: ['mp4'] }],
			})
			.then((result) => {
				if (result.canceled === false) {
					const path = result.filePaths[0];
					video_player.src = path;
					$('#upload_text').text(path);
					video_player.load();
					localStorage.setItem('video_path', path);
				}
			})
			.catch((err) => {
				console.error(err);
			});
	});

	$('#dest_btn').click(() => {
		dialog
			.showOpenDialog({ properties: ['openDirectory'] })
			.then((result) => {
				if (result.canceled === false) {
					const path = result.filePaths[0];
					$('#save_text').text(path);
					localStorage.setItem('save_path', path);
				}
			})
			.catch((err) => {
				console.error(err);
			});
	});

	$('#continue_btn').click(() => {
		if (localStorage.getItem('video_path') !== null && localStorage.getItem('save_path') !== null) {
			$('#input_screen').css({ visibility: 'hidden' });
			$('#loading').css({ visibility: 'visible' });
			pythonScript(after_python_script);
		}
	});
};

const after_python_script = (err, data) => {
	if (err) {
		console.error(err);
	} else {
		let data_string = data.toString();
		let data_parsed = data_string.slice(data_string.indexOf('{'));
		localStorage.setItem('video_data', data_parsed);
	}
	initialize();
	$('#main_content').css({ visibility: 'visible' });
	$('#loading').css({ visibility: 'hidden' });
	skeleton_player.src = localStorage.getItem('save_path') + `\\${get_video_name()}.mp4`;
	skeleton_player.load();
};

const get_video_name = () => {
	const video_path = localStorage.getItem('video_path');
	const video_with_ext = _.last(video_path.split('\\'));
	const video_name = _.first(video_with_ext.split('.'));
	return video_name;
};

initializeStartScreen();
