const $ = require('jquery');
const play_btn = $('#play_btn');
const pause_btn = $('#pause_btn');
const video_player = $('#main_player')[0];
const input_btn = $('#input_btn');
const parts_tab = $('#parts_tab');
const parts_btn = $('#parts_btn');
const pythonScript = require('./js/runPython');

const body_parts = ['Head', 'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg', 'Left Foot', 'Right Foot'];

const initialize = () => {
	parts_btn.click(() => {
		parts_tab.css('display') === 'none' ? parts_tab.css({ display: 'block' }) : parts_tab.css({ display: 'none' });
	});

	play_btn.click(() => {
		video_player.play();
		video_player.ontimeupdate = () => console.log(video_player.currentTime);
	});
	pause_btn.click(() => {
		video_player.pause();
		console.log(video_player);
		console.log(video_player.currentTime);
		console.log(video_player.duration);
	});
	input_btn.change((e) => {
		let file = e.target.files[0];
		if (file) {
			video_player.src = file.path;
			video_player.load();
		}
	});
	// let body_parts = ['Head'];
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

const loadScreen = () => {};

initialize();
pythonScript();
