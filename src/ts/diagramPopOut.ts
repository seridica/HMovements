import { ipcRenderer } from 'electron';
import { IVideoData, BodyParts } from './constants';
import diagramHelper from './diagramHelper';

ipcRenderer.on('initialize-diagram', (event, arg) => {
	let bodyParts: BodyParts = arg[0];
	let videoData = arg[1];
	let epochThresholdData = arg[2];
	diagramHelper.setVideoPercentage(arg[3]);

	drawCanvas(bodyParts, videoData, epochThresholdData);
});

// Draws canvas on the blank canvas inserted in the function initalizeCanvas.
function drawCanvas(bodyParts: BodyParts, rawVideoData: any, epochThresholdData: any) {
	const videoData: IVideoData = JSON.parse(rawVideoData);

	for (let key in bodyParts) {
		let part = bodyParts[key].name;
		setupBlankDiagramForBodyPart(key);

		let chart: Chart = diagramHelper.createChart(
			key,
			part,
			videoData,
			epochThresholdData
		);
		ipcRenderer.on('reply-timestamp', (event, arg) => {
			diagramHelper.setVideoPercentage(arg);
			chart.update();
		});
	}
}

function setupBlankDiagramForBodyPart(key: string) {
	let diagram: HTMLElement = document.getElementById('diagram')!;
	let newDiagramId = key + '-diagram';
	diagram.id = newDiagramId;
}
