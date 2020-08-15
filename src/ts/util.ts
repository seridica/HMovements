import * as fs from 'fs';
import * as _ from 'lodash';
import * as $ from 'jquery';
import { generalThresholds, epochLength } from './constants';
import * as path from 'path';

// Calls processHelper with writeToFile to process video uploaded for the first time.
const processNewFile = (data: string, savePath: string, videoPath: string) => {
	try {
		const processedData = processRawData(data);
		writeToFile(processedData, savePath, videoPath);
		return processedData;
	} catch (e) {}
};

// Calls processHelper with updateFile to process new settings inputted by the user.
const processNewSetting = (data: string, savePath: string) => {
	try {
		const processedData = processRawData(data);
		updateFile(processedData, savePath);
		turnOffLoadingScreen();
		return processedData;
	} catch (e) {}
};

// Process the new motion data from the Python script and update or create a data.json file.
const processRawData = (data: string) => {
	let dataString = data.toString();
	let dataParsed = dataString.slice(dataString.indexOf('{'));
	if (!dataParsed) throw new Error('Video data cannot be read');
	return dataParsed;
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
const updateFile = (data: string, savePath: string) => {
	fs.writeFileSync(`${savePath}/data.json`, data, 'utf8');
};

// Creates data.json and config.json for processing a video for the first time.
const writeToFile = (data: string, savePath: string, videoPath: string) => {
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
		const videoData = fs.readFileSync(`${savePath}/data.json`, 'utf8');
		return [configFile, videoData];
	} catch (error) {
		alert('Make sure the folder is not missing any files.');
		return [];
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
const findNumOfFilesInDirectory = (savePath: string): number => {
	try {
		const files = fs.readdirSync(savePath);
		return files.length;
	} catch (e) {
		return 0;
	}
};

const toggleElementVisibility = (jQueryElement: JQuery<HTMLElement>, isVisible: boolean) => {
	let display: string = 'none';
	if (isVisible) display = '';
	jQueryElement.css({ display });
};

const checkIfVideosAreDoneLoading = (): Promise<void> => {
	const videoPlayer: HTMLVideoElement = $('#main_player')[0] as HTMLVideoElement;
	const skeletonPlayer: HTMLVideoElement = $('#skeleton_player')[0] as HTMLVideoElement;
	return new Promise((resolve, reject) => {
		var interval = setInterval(() => {
			if (videoPlayer.readyState >= 3 && skeletonPlayer.readyState >= 3) {
				clearInterval(interval);
				resolve();
			}
		}, 500);
	});
};

const turnOnLoadingScreen = () => {
	const mainContent = $('#main_content');
	const loading = $('#loading');
	toggleElementVisibility(mainContent, false);
	toggleElementVisibility(loading, true);
};

const turnOffLoadingScreen = () => {
	const mainContent = $('#main_content');
	const loading = $('#loading');
	toggleElementVisibility(mainContent, true);
	toggleElementVisibility(loading, false);
};

export {
	processNewSetting,
	processNewFile,
	getVideoName,
	importExistingFile,
	formatVideoTime,
	calculateVideoDurationByEpoch,
	findNumOfFilesInDirectory,
	toggleElementVisibility,
	checkIfVideosAreDoneLoading,
	turnOffLoadingScreen,
	turnOnLoadingScreen,
};
