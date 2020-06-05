const fs = require('fs');
const { body_parts_threshold, epoch_length } = require('./constants');
const process_new_file = (err, data) => {
	if (err) console.log(err);
	process_helper(data, write_to_file);
	initialize();
};

const process_new_setting = (err, data) => {
	if (err) console.log(err);
	process_helper(data, update_file);
	refresh_canvas();
	$('#loading').css({ visibility: 'hidden' });
	$('#main_content').css({ visibility: 'visible' });
};

const process_helper = (data, fn) => {
	let data_string = data.toString();
	let data_parsed = data_string.slice(data_string.indexOf('{'));
	localStorage.setItem('video_data', data_parsed);
	const save_path = localStorage.getItem('save_path');
	const video_path = localStorage.getItem('video_path');
	fn(save_path, video_path, data_string);
};

const get_video_name = (video_path) => {
	if (video_path) {
		const video_with_ext = _.last(video_path.split('\\'));
		const video_name = _.first(video_with_ext.split('.'));
		return video_name;
	}
};

const update_file = (save_path, video_path, data) => {
	fs.writeFileSync(`${save_path}/data.json`, data, 'utf8');
	console.log('test');
};

const write_to_file = (save_path, video_path, data) => {
	const json = {
		video_path,
		body_parts_threshold,
		epoch_length,
	};
	fs.writeFileSync(`${save_path}/data.json`, data, 'utf8');
	fs.writeFileSync(`${save_path}/config.json`, JSON.stringify(json), 'utf8');
};

const import_existing_file = (save_path) => {
	try {
		let config_file = fs.readFileSync(`${save_path}/config.json`, 'utf8');
		config_file = JSON.parse(config_file);
		const video_path = config_file.video_path;
		const video_data = fs.readFileSync(`${save_path}/data.json`, 'utf8');
		localStorage.setItem('save_path', save_path);
		localStorage.setItem('video_path', video_path);
		localStorage.setItem('video_data', video_data);
		return config_file;
	} catch (error) {
		alert('Make sure the folder is not missing any files.');
		return null;
	}
};
const format_video_time = (time) => {
	var hours = Math.floor(time / 3600);
	var minutes = Math.floor((time % 3600) / 60);
	var seconds = Math.floor((time % 3600) % 60);
	let display = '';
	if (hours > 0) display += hours + ':';
	minutes < 10 ? (display += '0' + minutes + ':') : (display += minutes + ':');
	seconds < 10 ? (display += '0' + seconds) : (display += seconds);
	return display;
};

const calculate_video_duration_by_epoch = (epoch, duration) => {
	return Math.floor(duration / epoch) * epoch;
};

module.exports = {
	process_new_setting,
	update_file,
	process_new_file,
	get_video_name,
	import_existing_file,
	format_video_time,
	calculate_video_duration_by_epoch,
};
