import { formatVideoTime, checkIfVideosAreDoneLoading, toggleElementVisibility, turnOffLoadingScreen } from './util';
import { ConfigStore } from './configstore';
import * as $ from 'jquery';
import * as path from 'path';

export default function video(videoPlayer: HTMLVideoElement, skeletonPlayer: HTMLVideoElement, configStore: ConfigStore, diagram: any) {
	// Initializes the video players and makes sure the video are loaded properly before showing the main screen.
	function initVideoPlayers(): void {
		loadVideos();
		checkIfVideosAreDoneLoading().then(loadMainContent);
		videoPlayer.ontimeupdate = updateAsVideoPlays;
	}

	function loadMainContent() {
		const videoTime = $('#video_time');
		videoTime.text(formatVideoTime(videoPlayer.currentTime) + '/' + formatVideoTime(videoPlayer.duration));
		turnOffLoadingScreen();
	}

	function updateAsVideoPlays() {
		let progressBarContainer = $('#progress_bar_container');
		let progressBar = $('#progress_bar');
		let videoTime = $('#video_time');
		let playButton = $('#play_btn');
		let pauseButton = $('#pause_btn');
		const barWidth: number = progressBarContainer.width()!;
		const percentage = videoPlayer.currentTime / videoPlayer.duration;
		progressBar.css({ width: percentage * barWidth });
		videoTime.text(formatVideoTime(videoPlayer.currentTime) + ' / ' + formatVideoTime(videoPlayer.duration));
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
		let playButton = $('#play_btn');
		let pauseButton = $('#pause_btn');
		playButton.click(() => {
			videoPlayer.play();
			skeletonPlayer.play();
			toggleElementVisibility(pauseButton, true);
			toggleElementVisibility(playButton, false);
		});
	}

	function initPauseButton() {
		let playButton = $('#play_btn');
		let pauseButton = $('#pause_btn');
		pauseButton.click(() => {
			videoPlayer.pause();
			skeletonPlayer.pause();
			toggleElementVisibility(playButton, true);
			toggleElementVisibility(pauseButton, false);
		});
	}

	function initVideoTrackBar() {
		let hasMouseClickedOnTrackBar = false;
		let progressBarContainer = $('#progress_bar_container');

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
		let progressBarContainer = $('#progress_bar_container');
		let progressBar = $('#progress_bar');
		let videoTime = $('#video_time');
		const progressBarContainerWidth = progressBarContainer.width()!;
		const posX = (newPositionX - progressBarContainer.offset()!.left) / progressBarContainerWidth;
		progressBar.css({ width: posX * progressBarContainerWidth });
		videoPlayer.currentTime = videoPlayer.duration * posX;
		skeletonPlayer.currentTime = videoPlayer.duration * posX;
		videoTime.text(formatVideoTime(videoPlayer.currentTime) + ' / ' + formatVideoTime(videoPlayer.duration));
	}

	function loadVideos() {
		videoPlayer.src = configStore.get('videoPath');
		skeletonPlayer.src = configStore.get('skeletonPath');
		videoPlayer.load();
		skeletonPlayer.load();
		resetVideoTime();
	}

	function resetVideoTime() {
		checkIfVideosAreDoneLoading().then(() => {
			let progressBar = $('#progress_bar');
			let videoTime = $('#video_time');
			videoPlayer.currentTime = 0;
			skeletonPlayer.currentTime = 0;
			progressBar.css({ width: 0 });
			videoTime.text(formatVideoTime(videoPlayer.currentTime) + ' / ' + formatVideoTime(videoPlayer.duration));
			diagram.refreshCanvas();
		});
	}

	function pauseVideoIfPlaying() {
		let pauseButton = $('#pause_btn');
		if (!videoPlayer.paused) {
			console.log('here');
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
