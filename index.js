const $ = require('jquery');
const _ = require('lodash');
const video_player = $('#main_player')[0];
const skeleton_player = $('#skeleton_player')[0];
const parts_tab = $('#parts_tab');
const python_script = require('./js/runPython');
const util = require('./js/util');
const diagram = require('./js/diagrams');
const { remote, ipcRenderer } = require('electron');
const { body_parts, body_parts_threshold, epoch_length } = require('./js/constants');
const ConfigStore = require('./js/configstore');
var config_store = null;
var canva_htmls = [];
const initialize_video_players = () => {
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
};

const initialize_video_controls = () => {
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
};

const refresh_canvas = () => {
	diagram.drawCanvas(config_store);
};

const initialize_diagrams = () => {
	diagram.initializeCanvas();
	diagram.drawCanvas(config_store);

	const parts_folder = $('#parts_btn_folder');
	body_parts.map((part) => {
		parts_folder.append(`<div id=${part.replace(' ', '')} data-toggle="false" class="dim, parts" >${part}</div>`);
	});

	body_parts.forEach((part) => {
		const id = part.replace(' ', '');
		var part_diagram = $('#' + id + '_diagram_container');
		var body_html = part_diagram.detach();
		canva_htmls.push(body_html);
		$('#' + id).click(function () {
			let color = '#ebebeb';
			$(this).data({ toggle: !$(this).data('toggle') });
			if (!$(this).data('toggle')) {
				color = 'black';
				part_diagram.detach();
			} else {
				body_html.appendTo('#diagram_container');
			}
			$(this).css({ color, 'border-color': color });
		});
	});
};

const initialize_others = () => {
	let settings = config_store.mutable_data;
	let mutable_settings_list = [];
	for (let key in settings) {
		mutable_settings_list.push(`
			<div style="flex: 1; align-items: center;">
				<label style="font-size: 1vw; text-align: center;">${key == 'epoch_length' ? 'Epoch Length' : key}: </label>
				<input
					id="${key}_setting"
					style="text-align: center; font-size: 1vw; height: 3vh; width: 7vw; outline: none; border: none; border-bottom: 1px solid black;"
					type="text"
					value="${settings[key]}"
				/>
			</div>
		`);
	}
	mutable_settings_list.map((i) => {
		$('#settings_container').append(i);
	});

	const refresh_settings = () => {
		let settings = config_store.mutable_data;
		for (let key in settings) {
			$('#' + key + '_setting').val(settings[key]);
		}
	};

	const exit_settings = () => {
		$('#settings_content').animate(
			{ top: '50vh', opacity: '0%' },
			{
				duration: 500,
				complete: () => {
					$('#settings_content').css({ display: 'none' });
				},
			}
		);
	};

	const save_settings = () => {
		let settings = config_store.mutable_data;
		let new_settings = {};
		let threshold = {};
		for (let key in settings) {
			let setting = $('#' + key + '_setting').val();
			if (isNaN(setting)) {
				throw new Error('Please enter numbers only');
			}
			if (key === 'epoch_length') new_settings = { epoch_length: setting };
			else {
				threshold[key] = setting;
			}
		}
		new_settings = _.assign(new_settings, { threshold });
		config_store.save_data(new_settings);
	};

	$('#close_btn').click(() => {
		refresh_settings();
	});

	$('#settings_btn').click(() => {
		$('#settings_content').css({ display: 'flex', top: '50vh', opacity: '0%' });
		$('#settings_content').animate({ top: '25vh', opacity: '100%' }, 500);
		refresh_settings();
	});

	$('#close_btn').click(exit_settings);

	$('#content_wrapper').click(exit_settings);

	$('#save_btn').click(async () => {
		try {
			save_settings();
			exit_settings();
			$('#loading').css({ visibility: 'visible' });
			$('#main_content').css({ visibility: 'hidden' });
			python_script(util.process_new_setting, config_store.mutable_data);
		} catch (error) {
			alert(error.message);
		}
	});
};

const initialize_start_screen = () => {
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
					localStorage.setItem('video_path', path);
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
			python_script(util.process_new_file);
			config_store = new ConfigStore(localStorage.getItem('video_path'), localStorage.getItem('save_path'), body_parts_threshold, epoch_length);
		}
	});

	$('#import_btn').click(() => {
		remote.dialog.showOpenDialog({ properties: ['openDirectory'] }).then(async (result) => {
			if (result.canceled === false) {
				const path = result.filePaths[0];
				$('#input_screen').css({ visibility: 'hidden' });
				const config_file = util.import_existing_file(path);
				if (config_file) {
					config_store = new ConfigStore(
						config_file.video_path,
						localStorage.getItem('save_path'),
						config_file.body_parts_threshold,
						config_file.epoch_length
					);
					initialize();
				}
			}
		});
	});
};

const initialize = () => {
	initialize_video_players();
	initialize_video_controls();
	initialize_diagrams();
	initialize_others();
};

initialize_start_screen();
// python_script(util.process_new_file);
