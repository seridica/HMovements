const $ = require('jquery');
const _ = require('lodash');
const video_player = $('#main_player')[0];
const skeleton_player = $('#skeleton_player')[0];
const parts_tab = $('#parts_tab');
const pythonScript = require('./js/runPython');
const util = require('./js/util');
const { dialog } = require('electron').remote;
const body_parts = ['Head', 'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg', 'Left Foot', 'Right Foot'];
const body_parts_threshold = {
	Head: 0.14,
	LeftArm: 0.19,
	RightArm: 0.19,
	LeftLeg: 0.97,
	RightLeg: 0.97,
	LeftFoot: 0.36,
	RightFoot: 0.36,
};
const initialize = () => {
	const video_path = localStorage.getItem('video_path');
	const save_path = localStorage.getItem('save_path');
	// video_player.src = video_path;
	video_player.load();
	const check_video = () => {
		var interval = setInterval(() => {
			if (video_player.readyState >= 3) {
				$('#video_time').text(util.format_video_time(video_player.currentTime) + ' / ' + util.format_video_time(video_player.duration));
				$('#main_content').css({ visibility: 'visible' });
				$('#loading').css({ visibility: 'hidden' });
				clearInterval(interval);
			}
		}, 500);
	};
	check_video();
	// skeleton_player.src = save_path + `\\${util.get_video_name(video_path)}.mp4`;
	// skeleton_player.load();
	$('#parts_btn').click(() => {
		parts_tab.css('display') === 'none' ? parts_tab.css({ display: 'block' }) : parts_tab.css({ display: 'none' });
	});

	$('#play_btn').click(() => {
		video_player.play();
		// skeleton_player.play();
		video_player.ontimeupdate = () => {
			const bar_width = $('#progress_bar_container').width();
			const percentage = video_player.currentTime / video_player.duration;
			$('#progress_bar').css({ width: percentage * bar_width });
			$('#video_time').text(util.format_video_time(video_player.currentTime) + ' / ' + util.format_video_time(video_player.duration));
			if (video_player.ended) {
				$('#play_btn').css({ display: 'inline' });
				$('#pause_btn').css({ display: 'none' });
			}
		};
		$('#pause_btn').css({ display: 'inline' });
		$('#play_btn').css({ display: 'none' });
	});

	$('#pause_btn').click(() => {
		video_player.pause();
		// skeleton_player.pause();
		$('#play_btn').css({ display: 'inline' });
		$('#pause_btn').css({ display: 'none' });
	});

	var clicking = false;
	$('#progress_bar_container').mousedown((e) => {
		clicking = true;
		const bar_width = $('#progress_bar_container').width();
		const posX = (e.pageX - $('#progress_bar_container').offset().left) / bar_width;
		$('#progress_bar').css({ width: posX * bar_width });
		video_player.currentTime = video_player.duration * posX;
		$('#video_time').text(util.format_video_time(video_player.currentTime) + ' / ' + util.format_video_time(video_player.duration));
	});

	$('#progress_bar_container').mousemove((e) => {
		if (clicking === true) {
			const bar_width = $('#progress_bar_container').width();
			const posX = (e.pageX - $('#progress_bar_container').offset().left) / bar_width;
			$('#progress_bar').css({ width: posX * bar_width });
			video_player.currentTime = video_player.duration * posX;
			$('#video_time').text(util.format_video_time(video_player.currentTime) + ' / ' + util.format_video_time(video_player.duration));
		}
	});

	$('#progress_bar_container').mouseup(() => {
		clicking = false;
	});

	const parts_folder = $('#parts_folder');
	body_parts.map((part) => {
		parts_folder.append(`<div id=${part.replace(' ', '')} data-toggle="false" class="dim, parts" >${part}</div>`);
	});
	body_parts.forEach((part) => {
		const id = part.replace(' ', '');
		var body_html = null;
		var part_diagram = null;
		$('#' + id).click(function () {
			if (part_diagram === null) {
				part_diagram = $('#' + id + '_diagram_container');
			}
			if (body_html === null) {
				body_html = part_diagram.detach();
			}
			console.log(part_diagram);
			let color = '#ebebeb';
			let display = 'block';
			$(this).data({ toggle: !$(this).data('toggle') });
			if ($(this).data('toggle') === false) {
				display = 'none';
				color = 'black';
				part_diagram.detach();
			} else {
				body_html.appendTo('#secondary_container');
			}
			$(this).css({ color, 'border-color': color });
			part_diagram.css({ display });
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
					$('#upload_text').text(path);
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
			pythonScript(util.after_python_script);
		}
	});

	$('#import_btn').click(() => {
		dialog.showOpenDialog({ properties: ['openDirectory'] }).then((result) => {
			if (result.canceled === false) {
				const path = result.filePaths[0];
				$('#input_screen').css({ visibility: 'hidden' });
				util.import_existing_file(path);
			}
		});
	});
};

initializeStartScreen();
pythonScript(util.after_python_script);
