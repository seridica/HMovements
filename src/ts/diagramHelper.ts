import * as ChartAnnotation from 'chartjs-plugin-annotation';
import { Chart } from 'chart.js';
import { fps } from './constants';

var diagramHelper = (function () {
	let videoPercentage: number = 0;
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
					enabled: true,
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

	// Sets up the chart configurations.
	function setupChart() {
		Chart.defaults.WithLine = Chart.defaults.line;
		Chart.controllers.WithLine = Chart.controllers.line.extend({
			draw: function (ease: any) {
				Chart.controllers.line.prototype.draw.call(this, ease);
				const ctx = this.chart.ctx,
					topY = this.chart.legend.bottom,
					bottomY = this.chart.chartArea.bottom;

				let percentage = videoPercentage;
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
	}

	// Set the video percentage.
	function setVideoPercentage(percentage: number) {
		videoPercentage = percentage;
	}

	// Creates a new chart and returns it.
	function createChart(key: string, part: string, videoData: any, epochThresholdData: any): Chart {
		const motionData = videoData.motion;
		const epochData = videoData.epoch;
		const partData = motionData[key] as number[];
		const partEpochData = epochData[key] as boolean[];
		var thresholdValue = 0;
		if (part.includes('Head')) {
			thresholdValue = epochThresholdData['Head'];
		} else if (part.includes('Arm')) {
			thresholdValue = epochThresholdData['Arms'];
		} else if (part.includes('Leg')) {
			thresholdValue = epochThresholdData['Legs'];
		} else {
			thresholdValue = epochThresholdData['Feet'];
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
		return new Chart(motionCtx, getChartOptions(part, dataPoints, thresholdValue, chartBackgroundColor, epochThresholdData['epochLength']));
	}

	setupChart();
	return {
		createChart,
		setVideoPercentage,
	};
})();
export default diagramHelper;
