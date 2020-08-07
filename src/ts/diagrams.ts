import { ipcRenderer } from 'electron';
import { bodyParts, IVideoData } from './constants';
import * as util from './util';
import ConfigStore from './configstore';
import * as $ from 'jquery';
import * as _ from 'lodash';
import diagramHelper from './diagramHelper';
var diagram = function (videoPlayer: HTMLVideoElement, configStore: ConfigStore) {
	// Initializes the diagram container by inserting blank canvas into it.
	function initializeCanvas() {
		for (let key in bodyParts) {
			$('#diagram_container').append(`
			<div id="${key}_diagram_container" style="position: relative;">
				<input id="${key}_diagram_popout" type="image" title="Pop Out" style="width: 1.5vw; height: 1.5vh; outline: none; position: absolute; right: 2%; top: 5%;" src="images/popout.svg" />
				<canvas id="${key}_diagram"  width=300 height=100></canvas>
			</div>
		`);
		}
	}

	function calculateVideoPercentage() {
		let percentage = 0;
		if (videoPlayer.readyState >= 1) {
			percentage = videoPlayer.currentTime / util.calculateVideoDurationByEpoch(configStore.epochLength, videoPlayer.duration);
		}
		percentage = Math.min(percentage, 1);
		return percentage;
	}

	// Draws canvas on the blank canvas inserted in the function initalizeCanvas.
	function drawCanvas() {
		if (localStorage.getItem('videoData') === null) return;
		const videoData: IVideoData = JSON.parse(localStorage.getItem('videoData')!);
		for (let key in bodyParts) {
			let part = bodyParts[key].name;
			const chart = diagramHelper.createChart(key, part, videoData, configStore.epochThresholdData);
			let interval: NodeJS.Timeout;
			$('#play_btn').click(() => {
				interval = setInterval(() => {
					if (videoPlayer.ended) clearInterval(interval);
					let curVideoPercentage = calculateVideoPercentage();
					diagramHelper.setVideoPercentage(curVideoPercentage);
					chart.update();
					chart.options.tooltips!.enabled = false;
					ipcRenderer.invoke('timestamp', curVideoPercentage);
				}, 500);
			});
			$('#pause_btn').click(() => {
				chart.options.tooltips!.enabled = true;
				if (interval) clearInterval(interval);
			});
		}
	}

	// Called when the settings is changed. Reinitializes and redraws the canvas to match the new settings.
	function refreshCanvas() {
		for (let key in bodyParts) {
			if ($('#' + key).data('toggle')) {
				$('#' + key).click();
			}
		}
		init(true);
	}

	// Calls initializeCanvas and drawCanvas and also inserts the buttons for body parts into the document body.
	function init(isNewSettings: boolean) {
		initializeCanvas();
		drawCanvas();

		if (isNewSettings === false) {
			const partsFolder: JQuery<HTMLDivElement> = $('#parts_btn_folder');
			for (let key in bodyParts) {
				partsFolder.append(`<div id=${key} data-toggle="false" class="dim parts" >${bodyParts[key].name}</div>`);
			}
		}

		for (let key in bodyParts) {
			let partDiagramContainer: JQuery<HTMLDivElement> = $('#' + key + '_diagram_container');
			let popout: JQuery<HTMLInputElement> = $('#' + key + '_diagram_popout');
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

			popout.click(() => {
				let arg = [_.pick(bodyParts, [key]), configStore.epochThresholdData, calculateVideoPercentage()];
				ipcRenderer.invoke('create-diagram-window', arg);
			});
		}
	}

	return {
		refreshCanvas,
		init,
	};
};

export default diagram;
