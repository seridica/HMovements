import { remote } from 'electron';
import { fps, generalThresholds, epochLength } from './constants';
import * as util from './util';
import { IConfigStore } from './configstore';
import * as $ from 'jquery';
import { processVideoWithOpenPoseCPU, processVideoWithOpenPoseGPU } from './runPython';
import * as path from 'path';

export default function startscreen(
	initialize: Function,
	videoPlayer: HTMLVideoElement,
	configStore: IConfigStore
) {
	// Initializes the startscreen by setting up the event handler functions for the buttons.
	function init() {
		initInputButton();
		initDestinationButton();
		initContinueButton();
		initImportButton();
	}

	function initInputButton() {
		let inputBtn: JQuery<HTMLElement> = $('#input-btn');
		let uploadText: JQuery<HTMLElement> = $('#upload-text');

		inputBtn.click(() => {
			remote.dialog
				.showOpenDialog(remote.getCurrentWindow(), {
					properties: ['openFile'],
					filters: [{ name: 'Videos', extensions: ['mp4'] }],
				})
				.then((result) => {
					if (result.canceled === false) {
						const videoPath = result.filePaths[0];
						uploadText.text(videoPath);
						configStore.set('videoPath', videoPath);
					}
				})
				.catch((err) => {
					console.error(err);
				});
		});
	}

	function initDestinationButton() {
		let destBtn: JQuery<HTMLElement> = $('#dest-btn');
		let saveText: JQuery<HTMLElement> = $('#save-text');

		destBtn.click(() => {
			remote.dialog
				.showOpenDialog(remote.getCurrentWindow(), {
					properties: ['openDirectory'],
				})
				.then((result) => {
					if (result.canceled === false) {
						const savePath = result.filePaths[0];
						const numOfFilesInDirectory = util.findNumOfFilesInDirectory(
							savePath
						);
						if (numOfFilesInDirectory === 0) {
							saveText.text(savePath);
							configStore.set('savePath', savePath);
						} else {
							let message = 'Make sure the save folder is empty.';
							util.sendAlertMessage({ message });
						}
					}
				})
				.catch((err) => {
					console.error(err);
				});
		});
	}

	function initContinueButton() {
		let continueBtn: JQuery<HTMLElement> = $('#continue-btn');
		let inputScreen: JQuery<HTMLElement> = $('#input-screen');
		let loadingScreen: JQuery<HTMLElement> = $('#loading');

		continueBtn.click(async () => {
			const savePath = configStore.get('savePath');
			const videoPath = configStore.get('videoPath');
			if (videoPath !== null && savePath !== null) {
				configStore.set('epochLength', epochLength);
				configStore.set('thresholds', generalThresholds);
				configStore.set('skeletonPath', path.join(savePath, 'skeleton.mp4'));
				util.toggleElementVisibility(inputScreen, false);
				util.toggleElementVisibility(loadingScreen, true);
				await initLoadingScreen();
				await processVideoUsingOpenPose();
			} else {
				let message =
					'Make sure you have uploaded a video and selected a save location.';
				util.sendAlertMessage({ message });
			}
		});
	}

	async function processVideoUsingOpenPose() {
		const responseWithOpenPoseGPU = await processVideoWithOpenPoseGPU();
		if (responseWithOpenPoseGPU !== null) {
			processRawDataFromOpenPose(responseWithOpenPoseGPU);
		} else {
			const responseWithOpenPoseCPU = await processVideoWithOpenPoseCPU();

			if (responseWithOpenPoseCPU !== null) {
				processRawDataFromOpenPose(responseWithOpenPoseCPU);
			} else {
				let message =
					'Something went wrong. Please check if any files in the application folder is missing.';
				util.sendAlertMessage({ message });
				document.location.reload();
			}
		}
	}

	function processRawDataFromOpenPose(rawData: any) {
		try {
			const videoData = util.processRawData(rawData);
			configStore.set('videoData', videoData);
			util.writeToFile(configStore);
			initialize();
			notifyVideoCompletion();
		} catch (e) {
			document.location.reload();
			let message = 'Something went wrong. The video was not processed.';
			util.sendAlertMessage({ message });
		}
	}

	function notifyVideoCompletion() {
		new Notification('HMovements', {
			body: 'Video Processed.',
		});
	}

	function initImportButton() {
		let inputScreen: JQuery<HTMLElement> = $('#input-screen');
		let importBtn: JQuery<HTMLElement> = $('#import-btn');
		let loadingScreen: JQuery<HTMLElement> = $('#loading');
		importBtn.click(() => {
			remote.dialog
				.showOpenDialog(remote.getCurrentWindow(), {
					properties: ['openDirectory'],
				})
				.then(async (result) => {
					if (result.canceled === false) {
						const savePath = result.filePaths[0];
						const [configFile, videoData] = util.importExistingFile(savePath);
						if (configFile !== undefined) {
							configStore.set('videoPath', configFile.videoPath);
							configStore.set('savePath', savePath);
							configStore.set('thresholds', configFile.bodyPartsThreshold);
							configStore.set('epochLength', configFile.epochLength);
							configStore.set('skeletonPath', configFile.skeletonPath);
							configStore.set('videoData', videoData);
							util.toggleElementVisibility(inputScreen, false);
							util.toggleElementVisibility(loadingScreen, true);
							initialize();
						}
					}
				});
		});
	}

	async function initLoadingScreen() {
		let videoPath: string = configStore.get('videoPath');
		let savePath: string = configStore.get('savePath');
		videoPlayer.src = videoPath;
		videoPlayer.load();
		try {
			await calculateLoadingPercentage(savePath);
		} catch (e) {
			let message = 'Something went wrong. Please try again.';
			util.sendAlertMessage({ message });
		}
	}

	async function calculateLoadingPercentage(savePath: string) {
		let loadPercentage: JQuery<HTMLElement> = $('#load-percentage');
		await util.checkIfVideosAreDoneLoading();
		let prevNumFiles = 0;
		var intervalBetweenFileUpdates = setInterval(() => {
			const numFilesSoFar = util.findNumOfFilesInDirectory(
				path.join(savePath, 'json')
			);
			const currentPercentage = calculatePercentageToTwoDecimalPlaces(
				numFilesSoFar,
				videoPlayer.duration
			);
			if (isProcessingDone(numFilesSoFar, prevNumFiles, currentPercentage)) {
				clearInterval(intervalBetweenFileUpdates);
				loadPercentage.text('');
			} else {
				loadPercentage.text(currentPercentage + '%');
			}
		}, 2000);
	}

	function calculatePercentageToTwoDecimalPlaces(
		numFilesSoFar: number,
		videoDuration: number
	) {
		let totalEstimatedFiles = fps * Math.floor(videoDuration);
		let percentageSoFar = numFilesSoFar / totalEstimatedFiles;
		let percentageSoFarToTwoDecimalPlaces = Math.round(percentageSoFar * 10000) / 100;
		return percentageSoFarToTwoDecimalPlaces;
	}

	function isProcessingDone(
		numFilesSoFar: number,
		prevNumFiles: number,
		currentPercentage: number
	) {
		return (
			(numFilesSoFar == prevNumFiles && numFilesSoFar !== 0) ||
			currentPercentage >= 100
		);
	}

	return {
		init,
	};
}
