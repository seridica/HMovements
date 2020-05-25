require('chart.js');
const initializeCanvas = () => {
	body_parts.forEach((part) => {
		const partId = part.replace(' ', '');
		$('#secondary_container').append(`
		<div id="${partId}_diagram_container" style="flex 1; ">
			<canvas id="${partId}_diagram" width=300 height=100></canvas>
		</div>
	`);
	});
	// <div id="${partId}_diagram_maximize" style="position: relative; width: 25px; height: 25px; z-index: 2; top: 5%; margin-left: 97%;" >
	// 	<img src="images/fullscreen-24px.svg">
	// </div>
};

{
	/* <div id="test_subject" style="z-index: 2; border-left: 1px solid black; position: relative; bottom: 75px; left: 61px;">test</div> */
}
let chartMax = 0;
let xpos = 0;
const drawCanvas = () => {
	const video_data = JSON.parse(localStorage.getItem('video_data'));
	const motion_data = video_data.motion;
	const epoch_data = video_data.epoch;
	const frames_per_second = 30;
	Chart.defaults.WithLine = Chart.defaults.line;
	Chart.controllers.WithLine = Chart.controllers.line.extend({
		draw: function (ease) {
			Chart.controllers.line.prototype.draw.call(this, ease);
			var ctx = this.chart.ctx,
				topY = this.chart.legend.bottom,
				bottomY = this.chart.chartArea.bottom;

			chartMax = this.chart.chartArea.right - this.chart.chartArea.left + 4;
			// draw line
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(this.chart.chartArea.left + xpos, topY);
			ctx.lineTo(this.chart.chartArea.left + xpos, bottomY);
			ctx.lineWidth = 2;
			ctx.strokeStyle = '#07C';
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
		const chart_background_color = part_epoch_data.map((epoch) => {
			return epoch ? 'rgba(139, 240, 193, 0.2)' : 'rgba(255, 99, 132, 0.1)';
		});
		let datap = [];
		for (let i = 0; i < part_data.length; i++) {
			datap.push({ x: i / frames_per_second, y: part_data[i] });
		}
		let partId = part.replace(' ', '') + '_diagram';
		var motion_ctx = document.getElementById(partId).getContext('2d');
		var myChart = new Chart(motion_ctx, {
			type: 'WithLine',
			data: {
				datasets: [
					{
						label: part,
						data: datap,
						fill: false,
						backgroundColor: 'rgba(255, 99, 132, 0.2)',
						borderColor: 'rgba(255, 99, 132, 1)',
						borderWidth: 1,
						pointRadius: 0,
					},
				],
			},
			options: {
				chartArea: {
					backgroundColor: chart_background_color,
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
		});
		$('#' + partId + '_container').css({ display: 'none' });
		$('#play_btn').click(() => {
			xpos = 0;
			myChart.render();
		});
	});
};

initializeCanvas();
drawCanvas();
