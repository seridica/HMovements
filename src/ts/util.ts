import * as fs from 'fs';
import * as _ from 'lodash';
import * as $ from 'jquery';
import { generalThresholds, epochLength } from './constants';

// Calls processHelper with writeToFile to process video uploaded for the first time.
const processNewFile = (err: any, data: string, initFunction: () => void) => {
	if (!err) {
		try {
			processHelper(data, writeToFile);
			initFunction();
		} catch (e) {}
	}
};

// Calls processHelper with updateFile to process new settings inputted by the user.
const processNewSetting = (err: any, data: string, refreshCanvas: () => void) => {
	if (!err) {
		try {
			processHelper(data, updateFile);
			refreshCanvas();
			$('#loading').css({ visibility: 'hidden' });
			$('#main_content').css({ visibility: 'visible' });
		} catch (e) {}
	}
};

// Process the new motion data from the Python script and update or create a data.json file.
const processHelper = (data: string, fn: Function) => {
	let dataString = data.toString();
	let dataParsed = dataString.slice(dataString.indexOf('{'));
	if (!dataParsed) throw new Error('Video data cannot be read');
	localStorage.setItem('videoData', dataParsed);
	const savePath = localStorage.getItem('savePath')!;
	const videoPath = localStorage.getItem('videoPath')!;
	fn(savePath, videoPath, dataString);
};

// Gets the video name of the inputted video.
const getVideoName = (videoPath: string): string | null => {
	if (videoPath) {
		const videoWithExt: string = _.last(videoPath.split('\\'))!;
		const videoName = _.first(videoWithExt.split('.'))!;
		return videoName;
	}
	return null;
};

// Updates the existing data.json file to reflect new settings.
const updateFile = (savePath: string, videoPath: string, data: string) => {
	fs.writeFileSync(`${savePath}/data.json`, data, 'utf8');
};

// Creates data.json and config.json for processing a video for the first time.
const writeToFile = (savePath: string, videoPath: string, data: string) => {
	const json = {
		videoPath,
		bodyPartsThreshold: generalThresholds,
		epochLength,
	};
	fs.writeFileSync(`${savePath}/data.json`, data, 'utf8');
	fs.writeFileSync(`${savePath}/config.json`, JSON.stringify(json), 'utf8');
};

// Reads the config.json and data.json files for files that have already been processed before.
const importExistingFile = (savePath: string) => {
	try {
		let configFile: any = fs.readFileSync(`${savePath}/config.json`, 'utf8');
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

// Converts video time to (hh:mm:ss) format.
const formatVideoTime = (time: number) => {
	if (time < 0) time = 0;
	var hours = Math.floor(time / 3600);
	var minutes = Math.floor((time % 3600) / 60);
	var seconds = Math.floor((time % 3600) % 60);
	let display = '';
	if (hours > 0) display += hours + ':';
	minutes < 10 ? (display += '0' + minutes + ':') : (display += minutes + ':');
	seconds < 10 ? (display += '0' + seconds) : (display += seconds);
	return display;
};

// Rounds the video duration to the nearest multiple of epoch length.
const calculateVideoDurationByEpoch = (epoch: number, duration: number): number => {
	if (epoch > 0) {
		return Math.floor(duration / epoch) * epoch;
	} else return 0;
};

// Counts the files processed by OpenPose so far to track the progress.
const filesSoFar = (savePath: string): number => {
	try {
		const files = fs.readdirSync(savePath);
		return files.length;
	} catch (e) {
		console.log('not yet');
		return 0;
	}
};

export { processNewSetting, processNewFile, getVideoName, importExistingFile, formatVideoTime, calculateVideoDurationByEpoch, filesSoFar };
