require('chart.js');
const { body_parts_threshold_diagram, body_parts } = require('./constants');
const ChartAnnotation = require('chartjs-plugin-annotation');
const util = require('./util');
exports.initializeCanvas = () => {
	body_parts.forEach((part) => {
		const partId = part.replace(' ', '');
		$('#diagram_container').append(`
			<div id="${partId}_diagram_container" >
				<canvas id="${partId}_diagram"  width=300 height=110></canvas>
			</div>
		`);
	});
	// <div id="${partId}_diagram_maximize" style="position: relative; width: 25px; height: 25px; z-index: 2; top: 5%; margin-left: 97%;" >
	// 	<img src="images/fullscreen.svg">
	// </div>
};

function get_chart_options(part, data, threshold_value, background_color) {
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
						value: threshold_value,
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
				backgroundColor: background_color,
			},
			scales: {
				xAxes: [
					{
						ticks: {
							beginAtZero: true,
							stepSize: 5,
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

exports.drawCanvas = (config_store) => {
	const video_data = JSON.parse(localStorage.getItem('video_data'));
	const motion_data = video_data.motion;
	const epoch_data = video_data.epoch;
	const frames_per_second = 30;
	Chart.defaults.WithLine = Chart.defaults.line;
	Chart.controllers.WithLine = Chart.controllers.line.extend({
		draw: function (ease) {
			Chart.controllers.line.prototype.draw.call(this, ease);
			const ctx = this.chart.ctx,
				topY = this.chart.legend.bottom,
				bottomY = this.chart.chartArea.bottom;

			let percentage = 0;
			if (video_player.readyState >= 3) {
				percentage = video_player.currentTime / util.calculate_video_duration_by_epoch(5.0, video_player.duration);
			}
			percentage = Math.min(percentage, 1);
			const chart_max = this.chart.chartArea.right - this.chart.chartArea.left;
			// draw line
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(this.chart.chartArea.left + percentage * chart_max, topY);
			ctx.lineTo(this.chart.chartArea.left + percentage * chart_max, bottomY);
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
	body_parts.forEach((part) => {
		const part_data = motion_data[part.replace(' ', '')];
		const part_epoch_data = epoch_data[part.replace(' ', '')];
		var threshold_value = 0;
		if (part.includes('Head')) {
			threshold_value = config_store.mutable_data['Head'];
		} else if (part.includes('Arm')) {
			threshold_value = config_store.mutable_data['Arms'];
		} else if (part.includes('Leg')) {
			threshold_value = config_store.mutable_data['Legs'];
		} else {
			threshold_value = config_store.mutable_data['Feet'];
		}
		const chart_background_color = part_epoch_data.map((epoch) => {
			return epoch ? 'rgba(139, 240, 193, 0.2)' : 'rgba(255, 99, 132, 0.1)';
		});
		let data_points = [];
		for (let i = 0; i < part_data.length; i++) {
			data_points.push({ x: i / frames_per_second, y: part_data[i] });
		}
		let partId = part.replace(' ', '') + '_diagram';
		const motion_ctx = document.getElementById(partId).getContext('2d');
		const chart = new Chart(motion_ctx, get_chart_options(part, data_points, threshold_value, chart_background_color));
		let interval = null;
		$('#play_btn').click(() => {
			interval = setInterval(() => {
				if (video_player.ended) clearInterval(interval);
				chart.update();
			}, 500);
		});
		$('#pause_btn').click(() => {
			if (interval) clearInterval(interval);
		});
	});
};
