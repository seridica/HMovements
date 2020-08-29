import {
	formatVideoTime,
	checkIfVideosAreDoneLoading,
	toggleElementVisibility,
	turnOffLoadingScreen,
} from './util';
import { IConfigStore } from './configstore';
import * as $ from 'jquery';

export default function video(
	videoPlayer: HTMLVideoElement,
	skeletonPlayer: HTMLVideoElement,
	configStore: IConfigStore,
	diagram: any
) {
	// Initializes the video players and makes sure the video are loaded properly before showing the main screen.
	function initVideoPlayers(): void {
		loadVideos();
		checkIfVideosAreDoneLoading().then(loadMainContent);
	}

	function loadMainContent() {
		const videoTime = $('#video-time');
		videoTime.text(
			formatVideoTime(videoPlayer.currentTime) +
				'/' +
				formatVideoTime(videoPlayer.duration)
		);
		turnOffLoadingScreen();
	}

	function updateAsVideoPlays() {
		let progressBarContainer = $('#progress-bar-container');
		let progressBar = $('#progress-bar');
		let videoTime = $('#video-time');
		let playButton = $('#play-btn');
		let pauseButton = $('#pause-btn');

		const barWidth: number = progressBarContainer.width()!;
		const percentage = videoPlayer.currentTime / videoPlayer.duration;
		progressBar.css({ width: percentage * barWidth });
		videoTime.text(
			formatVideoTime(videoPlayer.currentTime) +
				' / ' +
				formatVideoTime(videoPlayer.duration)
		);
		if (videoPlayer.ended) {
			toggleElementVisibility(playButton, true);
			toggleElementVisibility(pauseButton, false);
		}
	}

	// Initializes the video controls.
	function initVideoControls() {
		initPlayButton();
		initPauseButton();
		initVideoTrackBar();
	}

	function initPlayButton() {
		let playButton = $('#play-btn');
		let pauseButton = $('#pause-btn');
		playButton.click(() => {
			waitForVideoToSync().then(() => {
				videoPlayer.play();
				skeletonPlayer.play();
			});
			toggleElementVisibility(pauseButton, true);
			toggleElementVisibility(playButton, false);
		});
	}

	function initPauseButton() {
		let playButton = $('#play-btn');
		let pauseButton = $('#pause-btn');
		pauseButton.click(() => {
			videoPlayer.pause();
			skeletonPlayer.pause();
			toggleElementVisibility(playButton, true);
			toggleElementVisibility(pauseButton, false);
		});
	}

	function initVideoTrackBar() {
		let hasMouseClickedOnTrackBar = false;
		let progressBarContainer = $('#progress-bar-container');

		progressBarContainer.mousedown((e) => {
			hasMouseClickedOnTrackBar = true;
			handleProgressBarPositionChange(e.pageX);
		});

		progressBarContainer.mousemove((e) => {
			if (hasMouseClickedOnTrackBar === true) {
				handleProgressBarPositionChange(e.pageX);
			}
		});

		progressBarContainer.mouseup(() => {
			hasMouseClickedOnTrackBar = false;
		});

		progressBarContainer.mouseleave(() => {
			hasMouseClickedOnTrackBar = false;
		});
	}

	function handleProgressBarPositionChange(newPositionX: number) {
		let progressBarContainer = $('#progress-bar-container');
		let progressBar = $('#progress-bar');
		let videoTime = $('#video-time');
		let currentlyPlaying = !videoPlayer.paused;
		const progressBarContainerWidth = progressBarContainer.width()!;
		const posX =
			(newPositionX - progressBarContainer.offset()!.left) /
			progressBarContainerWidth;
		progressBar.css({ width: posX * progressBarContainerWidth });
		if (currentlyPlaying) {
			videoPlayer.pause();
			skeletonPlayer.pause();
		}
		videoPlayer.currentTime = videoPlayer.duration * posX;
		skeletonPlayer.currentTime = videoPlayer.duration * posX;
		if (currentlyPlaying) {
			waitForVideoToSync().then(() => {
				videoPlayer.play();
				skeletonPlayer.play();
			});
		}
		videoTime.text(
			formatVideoTime(videoPlayer.currentTime) +
				' / ' +
				formatVideoTime(videoPlayer.duration)
		);
	}

	function waitForVideoToSync() {
		return new Promise((resolve, reject) => {
			let videoInterval = setInterval(() => {
				if (skeletonPlayer.readyState === 4 && videoPlayer.readyState === 4) {
					clearInterval(videoInterval);
					resolve();
				}
			}, 100);
		});
	}

	function loadVideos() {
		videoPlayer.src = configStore.get('videoPath');
		skeletonPlayer.src = configStore.get('skeletonPath');
		videoPlayer.load();
		skeletonPlayer.load();
		videoPlayer.ontimeupdate = updateAsVideoPlays;
		resetVideoTime();
	}

	function resetVideoTime() {
		checkIfVideosAreDoneLoading().then(() => {
			let progressBar = $('#progress-bar');
			let videoTime = $('#video-time');
			videoPlayer.currentTime = 0;
			skeletonPlayer.currentTime = 0;
			progressBar.css({ width: 0 });
			videoTime.text(
				formatVideoTime(videoPlayer.currentTime) +
					' / ' +
					formatVideoTime(videoPlayer.duration)
			);
			diagram.refreshCanvas();
		});
	}

	function pauseVideoIfPlaying() {
		let pauseButton = $('#pause-btn');
		if (!videoPlayer.paused) {
			pauseButton.click();
		}
	}

	function init() {
		initVideoPlayers();
		initVideoControls();
	}
	return {
		loadVideos,
		init,
		resetVideoTime,
		pauseVideoIfPlaying,
	};
}
