import { ipcRenderer } from 'electron';
import { bodyParts, IVideoData } from './constants';
import * as util from './util';
import { ConfigStore } from './configstore';
import * as $ from 'jquery';
import * as _ from 'lodash';
import diagramHelper from './diagramHelper';
var diagram = function (videoPlayer: HTMLVideoElement, configStore: ConfigStore) {
	// Initializes the diagram container by inserting blank canvas into it.
	function initCanvas() {
		let diagramContainer = $('#diagram_container');
		for (let key in bodyParts) {
			diagramContainer.append(`
			<div id="${key}_diagram_container" style="position: relative;">
				<input id="${key}_diagram_popout" type="image" title="Pop Out" style="width: 1.5vw; height: 1.5vh; outline: none; position: absolute; right: 2%; top: 5%;" src="images/popout.svg" />
				<canvas id="${key}_diagram"  width=300 height=100></canvas>
			</div>
		`);
		}
	}

	// Draws canvas on the blank canvas inserted in the function initalizeCanvas.
	function drawCanvas() {
		const videoData: IVideoData = JSON.parse(configStore.get('videoData'));
		let playButton = $('#play_btn');
		let pauseButton = $('#pause_btn');
		let curVideoPercentage = calculateVideoPercentage();
		diagramHelper.setVideoPercentage(curVideoPercentage);
		for (let key in bodyParts) {
			let part = bodyParts[key].name;
			const chart = diagramHelper.createChart(key, part, videoData, configStore.getEpochThresholdData());
			let interval: NodeJS.Timeout;
			playButton.click(() => {
				interval = setInterval(() => {
					if (videoPlayer.ended) clearInterval(interval);
					updateDiagram(chart);
					let curVideoPercentage = calculateVideoPercentage();
					diagramHelper.setVideoPercentage(curVideoPercentage);
					chart.update();
					chart.options.tooltips!.enabled = false;
					ipcRenderer.invoke('send-timestamp', curVideoPercentage);
				}, 500);
			});
			pauseButton.click(() => {
				chart.options.tooltips!.enabled = true;
				if (interval) clearInterval(interval);
			});
			initVideoScrollBarOnDiagram(chart);
		}
	}

	function initVideoScrollBarOnDiagram(chart: Chart) {
		let hasMouseClickedOnTrackBar = false;
		let progressBarContainer = $('#progress_bar_container');

		progressBarContainer.mousedown((e) => {
			hasMouseClickedOnTrackBar = true;
			updateDiagram(chart);
		});
		progressBarContainer.mousemove((e) => {
			if (hasMouseClickedOnTrackBar === true) {
				updateDiagram(chart);
			}
		});
		progressBarContainer.mouseup(() => {
			hasMouseClickedOnTrackBar = false;
		});
		progressBarContainer.mouseleave(() => {
			hasMouseClickedOnTrackBar = false;
		});
	}

	function updateDiagram(chart: Chart) {
		let curVideoPercentage = calculateVideoPercentage();
		diagramHelper.setVideoPercentage(curVideoPercentage);
		chart.update();
	}

	function calculateVideoPercentage() {
		let percentage = 0;
		if (isVideoPlayerLoaded()) {
			percentage = videoPlayer.currentTime / util.calculateVideoDurationByEpoch(configStore.get('epochLength'), videoPlayer.duration);
		}
		percentage = Math.min(percentage, 1);
		return percentage;
	}

	function isVideoPlayerLoaded() {
		return videoPlayer.readyState >= 1;
	}

	// Called when the settings is changed. Reinitializes and redraws the canvas to match the new settings.
	function refreshCanvas() {
		for (let key in bodyParts) {
			if ($('#' + key).data('toggle')) {
				$('#' + key).click();
			}
		}
		initDiagramsForNewSettings();
	}

	function initDiagramsForTheFirstTime() {
		initCanvas();
		drawCanvas();
		insertDiagramToggleButtons();
		initDiagramPopOutButtons();
		initDiagramToggleButtons();
	}

	function insertDiagramToggleButtons() {
		const partsFolder: JQuery<HTMLDivElement> = $('#parts_btn_folder');
		for (let key in bodyParts) {
			partsFolder.append(`<div id=${key} data-toggle="false" class="dim parts" >${bodyParts[key].name}</div>`);
		}
	}

	function initDiagramsForNewSettings() {
		initCanvas();
		drawCanvas();
		initDiagramPopOutButtons();
		initDiagramToggleButtons();
	}

	function initDiagramToggleButtons() {
		for (let key in bodyParts) {
			let partDiagramContainer: JQuery<HTMLDivElement> = $('#' + key + '_diagram_container');
			let bodyHtml: JQuery<HTMLDivElement> = partDiagramContainer.detach();
			$('#' + key).off('click');
			$('#' + key).click(function () {
				let color: string = '#ebebeb';
				$(this).data({ toggle: !$(this).data('toggle') });
				if (!$(this).data('toggle')) {
					color = 'black';
					partDiagramContainer.detach();
				} else {
					bodyHtml.appendTo('#diagram_container');
				}
				$(this).css({ color, 'border-color': color });
			});
		}
	}

	function initDiagramPopOutButtons() {
		for (let key in bodyParts) {
			let popout: JQuery<HTMLInputElement> = $('#' + key + '_diagram_popout');
			popout.click(() => {
				let arg = [_.pick(bodyParts, [key]), configStore.get('videoData'), configStore.getEpochThresholdData(), calculateVideoPercentage()];
				ipcRenderer.invoke('create-diagram-window', arg);
			});
		}
	}

	return {
		refreshCanvas,
		init: initDiagramsForTheFirstTime,
	};
};

export default diagram;
