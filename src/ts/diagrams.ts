import { Chart, ChartConfiguration } from 'chart.js';
import { bodyParts, fps, IVideoData, IBodyPartDetail } from './constants';
import * as ChartAnnotation from 'chartjs-plugin-annotation';
import * as util from './util';
import ConfigStore from './configstore';
import * as $ from 'jquery';

var diagram = function (videoPlayer: HTMLVideoElement, configStore: ConfigStore) {
	// Generates the chart options to be used by chart.js.
	function getChartOptions(part: string, data: { x: number; y: number }[], thresholdValue: number, backgroundColor: string[], epochLength: number) {
		const options: any = {
			type: 'WithLine',
			data: {
				datasets: [
					{
						label: part,
						data,
						fill: false,
						backgroundColor: 'rgba(255, 99, 132, 0.2)',
						borderColor: 'rgba(255, 99, 132, 1)',
						borderWidth: 1,
						pointRadius: 0,
					},
				],
			},
			plugins: [ChartAnnotation],
			options: {
				events: [],
				annotation: {
					annotations: [
						{
							type: 'line',
							mode: 'horizontal',
							scaleID: 'y-axis-0',
							value: thresholdValue,
							borderColor: 'rgb(255, 99, 132)',
							borderWidth: 2,
							label: {
								enabled: false,
								position: 'right',
								backgroundColor: 'rgba(0,0,0,0)',
								content: 'Motion Threshold',
								fontColor: 'black',
								yAdjust: 7,
							},
						},
					],
				},
				tooltips: {
					enabled: false,
				},
				animation: {
					duration: 0,
				},
				chartArea: {
					backgroundColor: backgroundColor,
				},
				scales: {
					xAxes: [
						{
							ticks: {
								beginAtZero: true,
								stepSize: epochLength,
								backdropColor: 'black',
							},
							distribution: 'linear',
							type: 'linear',
							scaleLabel: {
								display: true,
								labelString: 'time (s)',
							},
						},
					],
					yAxes: [
						{
							gridLines: {
								color: 'rgba(0,0,0,0)',
							},
							scaleLabel: {
								display: true,
								labelString: 'motion',
							},
						},
					],
				},
				title: {
					display: true,
					text: part,
					fontSize: 20,
				},
				legend: {
					display: false,
				},
			},
		};
		return options;
	}

	// Initializes the diagram container by inserting blank canvas into it.
	function initializeCanvas() {
		for (let key in bodyParts) {
			$('#diagram_container').append(`
			<div id="${key}_diagram_container" >
				<canvas id="${key}_diagram"  width=300 height=110></canvas>
			</div>
		`);
		}
	}

	// Draws canvas on the blank canvas inserted in the function initalizeCanvas.
	function drawCanvas() {
		if (localStorage.getItem('videoData') === null) return;
		const videoData: IVideoData = JSON.parse(localStorage.getItem('videoData')!);
		const motionData = videoData.motion;
		const epochData = videoData.epoch;
		Chart.defaults.WithLine = Chart.defaults.line;
		Chart.controllers.WithLine = Chart.controllers.line.extend({
			draw: function (ease: any) {
				Chart.controllers.line.prototype.draw.call(this, ease);
				const ctx = this.chart.ctx,
					topY = this.chart.legend.bottom,
					bottomY = this.chart.chartArea.bottom;

				let percentage = 0;
				if (videoPlayer.readyState >= 1) {
					percentage = videoPlayer.currentTime / util.calculateVideoDurationByEpoch(configStore.epochLength, videoPlayer.duration);
				}
				percentage = Math.min(percentage, 1);
				const chartMax = this.chart.chartArea.right - this.chart.chartArea.left;
				// draw line
				ctx.save();
				ctx.beginPath();
				ctx.moveTo(this.chart.chartArea.left + percentage * chartMax, topY);
				ctx.lineTo(this.chart.chartArea.left + percentage * chartMax, bottomY);
				ctx.lineWidth = 2;
				ctx.strokeStyle = 'black';
				ctx.stroke();
			},
		});

		Chart.pluginService.register({
			beforeDraw: function (chart, easing) {
				const options: any = chart.config.options;
				if (options.chartArea && options.chartArea.backgroundColor) {
					var ctx = chart.ctx!;
					var chartArea = chart.chartArea;

					ctx.save();
					const backgroundColors = options.chartArea.backgroundColor;
					const tickWidth = (chartArea.right - chartArea.left) / backgroundColors.length;
					for (let i = 0; i < backgroundColors.length; i++) {
						ctx.fillStyle = backgroundColors[i];
						ctx.fillRect(chartArea.left + tickWidth * i, chartArea.top, tickWidth, chartArea.bottom - chartArea.top);
					}
					ctx.restore();
				}
			},
		});
		for (let key in bodyParts) {
			let part = bodyParts[key].name;
			const partData = motionData[key] as number[];
			const partEpochData = epochData[key] as boolean[];
			var thresholdValue = 0;
			if (part.includes('Head')) {
				thresholdValue = configStore.mutableData['Head'];
			} else if (part.includes('Arm')) {
				thresholdValue = configStore.mutableData['Arms'];
			} else if (part.includes('Leg')) {
				thresholdValue = configStore.mutableData['Legs'];
			} else {
				thresholdValue = configStore.mutableData['Feet'];
			}
			const chartBackgroundColor: string[] = partEpochData.map((epoch: boolean) => {
				return epoch ? 'rgba(139, 240, 193, 0.2)' : 'rgba(255, 99, 132, 0.1)';
			});
			let dataPoints: { x: number; y: number }[] = [];
			for (let i = 0; i < partData.length; i++) {
				dataPoints.push({ x: i / fps, y: partData[i] });
			}
			let partId = part.replace(' ', '') + '_diagram';
			const canvas = document.getElementById(partId) as HTMLCanvasElement;
			const motionCtx = canvas.getContext('2d')!;
			const chart = new Chart(motionCtx, getChartOptions(part, dataPoints, thresholdValue, chartBackgroundColor, configStore.epochLength));
			let interval: NodeJS.Timeout;
			$('#play_btn').click(() => {
				interval = setInterval(() => {
					if (videoPlayer.ended) clearInterval(interval);
					chart.update();
				}, 500);
			});
			$('#pause_btn').click(() => {
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
				partsFolder.append(`<div id=${key} data-toggle="false" class="dim, parts" >${bodyParts[key].name}</div>`);
			}
		}

		for (let key in bodyParts) {
			let partDiagram: JQuery<HTMLDivElement> = $('#' + key + '_diagram_container');
			let bodyHtml: JQuery<HTMLDivElement> = partDiagram.detach();
			$('#' + key).off('click');
			$('#' + key).click(function () {
				let color: string = '#ebebeb';
				$(this).data({ toggle: !$(this).data('toggle') });
				if (!$(this).data('toggle')) {
					color = 'black';
					partDiagram.detach();
				} else {
					bodyHtml.appendTo('#diagram_container');
				}
				$(this).css({ color, 'border-color': color });
			});
		}
	}

	return {
		refreshCanvas,
		init,
	};
};

export default diagram;
