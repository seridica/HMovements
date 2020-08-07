import * as $ from 'jquery';
import * as _ from 'lodash';
import type ConfigStore from './ts/configstore';
import { processVideo, deidentifyVideo } from './ts/runPython';
import * as util from './ts/util';
import Diagram from './ts/diagrams';
import Video from './ts/videoplayer';
import Settings from './ts/settings';
import Startscreen from './ts/startscreen';
import Deidentify from './ts/deidentify';
import { remote } from 'electron';
const videoPlayer: HTMLVideoElement = $('#main_player')[0] as HTMLVideoElement;
const skeletonPlayer: HTMLVideoElement = $('#skeleton_player')[0] as HTMLVideoElement;

// Main initialization function that calls the initialization functions in other modules.
const init = (configStore: ConfigStore): void => {
	const diagram = Diagram(videoPlayer, configStore);
	const videoControl = Video(videoPlayer, skeletonPlayer, configStore);
	const settings = Settings(
		() => {
			processVideo(0, configStore.epochThresholdData).then((res: any) => {
				if (res) util.processNewSetting(res, diagram.refreshCanvas);
			});
		},
		videoPlayer,
		configStore,
		videoControl
	);
	const deidentify = Deidentify(deidentifyVideo, configStore, videoControl);
	videoControl.init();
	diagram.init(false);
	settings.init();
	deidentify.init();

	$('#main-menu-btn').click(() => {
		remote.dialog
			.showMessageBox(remote.getCurrentWindow(), {
				message: 'Are you sure you want to return to Main Menu?',
				title: 'Main Menu',
				buttons: ['Ok', 'Cancel'],
			})
			.then((res) => {
				if (res.response === 0) document.location.reload();
			});
	});
};
const startscreen = Startscreen(processVideo, init, videoPlayer);
startscreen.init();
