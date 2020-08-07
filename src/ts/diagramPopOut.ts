import { ipcRenderer } from 'electron';
import { IVideoData, BodyParts } from './constants';
import diagramHelper from './diagramHelper';

ipcRenderer.on('initialize-diagram', (event, arg) => {
	let bodyParts: BodyParts = arg[0];
	let epochThresholdData = arg[1];
	diagramHelper.setVideoPercentage(arg[2]);

	drawCanvas(bodyParts, epochThresholdData);
});

// Draws canvas on the blank canvas inserted in the function initalizeCanvas.
function drawCanvas(bodyParts: BodyParts, epochThresholdData: any) {
	if (localStorage.getItem('videoData') === null) return;
	const videoData: IVideoData = JSON.parse(localStorage.getItem('videoData')!);

	for (let key in bodyParts) {
		let part = bodyParts[key].name;
		document.getElementById('diagram')!.id = key + '_diagram';
		let chart: Chart = diagramHelper.createChart(key, part, videoData, epochThresholdData);
		ipcRenderer.on('reply-timestamp', (event, arg) => {
			diagramHelper.setVideoPercentage(arg);
			chart.update();
		});
	}
}
