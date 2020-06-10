require('chart.js');
const { bodyParts, fps } = require('./constants');
const ChartAnnotation = require('chartjs-plugin-annotation');
const util = require('./util');
exports.initializeCanvas = () => {
	bodyParts.forEach((part) => {
		const partId = part.replace(' ', '');
		$('#diagram_container').append(`
			<div id="${partId}_diagram_container" >
				<canvas id="${partId}_diagram"  width=300 height=110></canvas>
			</div>
		`);
	});
};

function getChartOptions(part, data, thresholdValue, backgroundColor, epochLength) {
	return {
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
							labelString: 'time',
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
}

exports.drawCanvas = (configStore) => {
	const videoData = JSON.parse(localStorage.getItem('videoData'));
	const motionData = videoData.motion;
	const epochData = videoData.epoch;
	Chart.defaults.WithLine = Chart.defaults.line;
	Chart.controllers.WithLine = Chart.controllers.line.extend({
		draw: function (ease) {
			Chart.controllers.line.prototype.draw.call(this, ease);
			const ctx = this.chart.ctx,
				topY = this.chart.legend.bottom,
				bottomY = this.chart.chartArea.bottom;

			let percentage = 0;
			if (videoPlayer.readyState >= 3) {
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
			if (chart.config.options.chartArea && chart.config.options.chartArea.backgroundColor) {
				var ctx = chart.chart.ctx;
				var chartArea = chart.chartArea;

				ctx.save();
				const backgroundColors = chart.config.options.chartArea.backgroundColor;
				const tickWidth = (chartArea.right - chartArea.left) / backgroundColors.length;
				for (let i = 0; i < backgroundColors.length; i++) {
					ctx.fillStyle = backgroundColors[i];
					ctx.fillRect(chartArea.left + tickWidth * i, chartArea.top, tickWidth, chartArea.bottom - chartArea.top);
				}
				ctx.restore();
			}
		},
	});
	bodyParts.forEach((part) => {
		const partData = motionData[part.replace(' ', '')];
		const partEpochData = epochData[part.replace(' ', '')];
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
		const chartBackgroundColor = partEpochData.map((epoch) => {
			return epoch ? 'rgba(139, 240, 193, 0.2)' : 'rgba(255, 99, 132, 0.1)';
		});
		let dataPoints = [];
		for (let i = 0; i < partData.length; i++) {
			dataPoints.push({ x: i / fps, y: partData[i] });
		}
		let partId = part.replace(' ', '') + '_diagram';
		const motionCtx = document.getElementById(partId).getContext('2d');
		const chart = new Chart(motionCtx, getChartOptions(part, dataPoints, thresholdValue, chartBackgroundColor, configStore.epochLength));
		let interval = null;
		$('#play_btn').click(() => {
			interval = setInterval(() => {
				if (videoPlayer.ended) clearInterval(interval);
				chart.update();
			}, 500);
		});
		$('#pause_btn').click(() => {
			if (interval) clearInterval(interval);
		});
	});
};
