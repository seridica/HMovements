const fs = require('fs');
const { bodyPartsThreshold, epochLength } = require('./constants');
const processNewFile = (err, data) => {
	if (err) console.log(err);
	processHelper(data, writeToFile);
	initialize();
};

const processNewSetting = (err, data) => {
	if (err) console.log(err);
	processHelper(data, updateFile);
	refreshCanvas();
	$('#loading').css({ visibility: 'hidden' });
	$('#main_content').css({ visibility: 'visible' });
};

const processHelper = (data, fn) => {
	let dataString = data.toString();
	let dataParsed = dataString.slice(dataString.indexOf('{'));
	localStorage.setItem('videoData', dataParsed);
	const savePath = localStorage.getItem('savePath');
	const videoPath = localStorage.getItem('videoPath');
	fn(savePath, videoPath, dataString);
};

const getVideoName = (videoPath) => {
	if (videoPath) {
		const videoWithExt = _.last(videoPath.split('\\'));
		const videoName = _.first(videoWithExt.split('.'));
		return videoName;
	}
};

const updateFile = (savePath, videoPath, data) => {
	fs.writeFileSync(`${savePath}/data.json`, data, 'utf8');
};

const writeToFile = (savePath, videoPath, data) => {
	const json = {
		videoPath,
		bodyPartsThreshold,
		epochLength,
	};
	fs.writeFileSync(`${savePath}/data.json`, data, 'utf8');
	fs.writeFileSync(`${savePath}/config.json`, JSON.stringify(json), 'utf8');
};

const importExistingFile = (savePath) => {
	try {
		let configFile = fs.readFileSync(`${savePath}/config.json`, 'utf8');
		configFile = JSON.parse(configFile);
		const videoPath = configFile.videoPath;
		const videoData = fs.readFileSync(`${savePath}/data.json`, 'utf8');
		localStorage.setItem('savePath', savePath);
		localStorage.setItem('videoPath', videoPath);
		localStorage.setItem('videoData', videoData);
		return configFile;
	} catch (error) {
		alert('Make sure the folder is not missing any files.');
		return null;
	}
};
const formatVideoTime = (time) => {
	var hours = Math.floor(time / 3600);
	var minutes = Math.floor((time % 3600) / 60);
	var seconds = Math.floor((time % 3600) % 60);
	let display = '';
	if (hours > 0) display += hours + ':';
	minutes < 10 ? (display += '0' + minutes + ':') : (display += minutes + ':');
	seconds < 10 ? (display += '0' + seconds) : (display += seconds);
	return display;
};

const calculateVideoDurationByEpoch = (epoch, duration) => {
	return Math.floor(duration / epoch) * epoch;
};

const filesSoFar = (savePath) => {
	try {
		const files = fs.readdirSync(savePath);
		return files.length;
	} catch (e) {
		console.log('not yet');
		return 0;
	}
};

module.exports = {
	processNewSetting,
	updateFile,
	processNewFile,
	getVideoName,
	importExistingFile,
	formatVideoTime,
	calculateVideoDurationByEpoch,
	filesSoFar,
};
