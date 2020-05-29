const fs = require('fs');

const after_python_script = (err, data) => {
	if (err) {
		console.error(err);
		return;
	}
	let data_string = data.toString();
	let data_parsed = data_string.slice(data_string.indexOf('{'));
	localStorage.setItem('video_data', data_parsed);
	const save_path = localStorage.getItem('save_path');
	const video_path = localStorage.getItem('video_path');
	write_to_file(save_path, video_path, data_string);
	initialize();
};

const get_video_name = (video_path) => {
	if (video_path) {
		const video_with_ext = _.last(video_path.split('\\'));
		const video_name = _.first(video_with_ext.split('.'));
		return video_name;
	}
};

const write_to_file = (save_path, video_path, data) => {
	const json = {
		video_path,
	};
	// fs.writeFileSync(`${save_path}/data.json`, data, 'utf8');
	// fs.writeFileSync(`${save_path}/config.json`, JSON.stringify(json), 'utf8');
};

const import_existing_file = (save_path) => {
	try {
		localStorage.setItem('save_path', save_path);
		const config_file = fs.readFileSync(`${save_path}/config.json`, 'utf8');
		const video_path = JSON.parse(config_file).video_path;
		localStorage.setItem('video_path', video_path);
		const video_data = fs.readFileSync(`${save_path}/data.json`, 'utf8');
		localStorage.setItem('video_data', video_data);
		initialize();
	} catch (error) {
		alert('Make sure the folder is not missing any files.');
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

module.exports = {
	after_python_script,
	get_video_name,
	import_existing_file,
	format_video_time,
};
