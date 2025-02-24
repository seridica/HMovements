import * as $ from 'jquery';
import * as _ from 'lodash';
import { IConfigStore, getConfigStore } from './ts/configstore';
import Diagram from './ts/diagrams';
import Video from './ts/videoplayer';
import Settings from './ts/settings';
import Startscreen from './ts/startscreen';
import Deidentify from './ts/deidentify';
const videoPlayer: HTMLVideoElement = $('#main-player')[0] as HTMLVideoElement;
const skeletonPlayer: HTMLVideoElement = $('#skeleton-player')[0] as HTMLVideoElement;
const configStore: IConfigStore = getConfigStore();
// Main initialization function that calls the initialization functions in other modules.
function init() {
	const diagram = Diagram(videoPlayer, configStore);
	const videoControl = Video(videoPlayer, skeletonPlayer, configStore, diagram);
	const settings = Settings(videoPlayer, configStore, videoControl, diagram);
	const deidentify = Deidentify(configStore, videoControl);

	videoControl.init();
	diagram.init();
	settings.init();
	deidentify.init();
}

const startscreen = Startscreen(init, videoPlayer, configStore);
startscreen.init();
