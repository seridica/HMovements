import * as fs from 'fs';
import * as _ from 'lodash';
import * as $ from 'jquery';
import { IConfigStore } from './configstore';
import { ipcRenderer } from 'electron';

// Process the new motion data from the Python script and update or create a data.json file.
const processRawData = (data: string) => {
	let dataString = data.toString();
	let startIndex = dataString.indexOf('{');
	let dataParsed = dataString.slice(startIndex);
	if (!dataParsed || startIndex === -1) throw new Error('Video data cannot be read.');
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
const updateFile = (configStore: IConfigStore) => {
	let data = configStore.get('videoData');
	let savePath = configStore.get('savePath');
	fs.writeFileSync(`${savePath}/data.json`, data, 'utf8');
};

// Creates data.json and config.json for processing a video for the first time.
const writeToFile = (configStore: IConfigStore) => {
	let savePath = configStore.get('savePath');
	let data = configStore.get('videoData');
	const json = {
		videoPath: configStore.get('videoPath'),
		bodyPartsThreshold: configStore.get('thresholds'),
		epochLength: configStore.get('epochLength'),
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
		let message = 'Make sure the folder is not missing any files.';
		sendAlertMessage({ message });
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

const toggleElementVisibility = (
	jQueryElement: JQuery<HTMLElement>,
	isVisible: boolean
) => {
	let display: string = 'none';
	if (isVisible) display = '';
	jQueryElement.css({ display });
};

const checkIfVideosAreDoneLoading = (): Promise<void> => {
	const videoPlayer: HTMLVideoElement = $('#main-player')[0] as HTMLVideoElement;
	return new Promise((resolve, reject) => {
		var interval = setInterval(() => {
			if (videoPlayer.readyState >= 3) {
				clearInterval(interval);
				resolve();
			}
		}, 500);
	});
};

const turnOnLoadingScreen = () => {
	const mainContent = $('#main-content');
	const loading = $('#loading');
	toggleElementVisibility(mainContent, false);
	toggleElementVisibility(loading, true);
};

const turnOffLoadingScreen = () => {
	const mainContent = $('#main-content');
	const loading = $('#loading');
	toggleElementVisibility(mainContent, true);
	toggleElementVisibility(loading, false);
};

const sendAlertMessage = (dialogOption: Electron.MessageBoxOptions) => {
	return ipcRenderer.invoke('alert-message', dialogOption);
};

export {
	processRawData,
	getVideoName,
	updateFile,
	writeToFile,
	importExistingFile,
	formatVideoTime,
	calculateVideoDurationByEpoch,
	findNumOfFilesInDirectory,
	toggleElementVisibility,
	checkIfVideosAreDoneLoading,
	turnOffLoadingScreen,
	turnOnLoadingScreen,
	sendAlertMessage,
};
