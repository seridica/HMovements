import * as $ from 'jquery';
import * as _ from 'lodash';
import type ConfigStore from './ts/configstore';
import pythonScript from './ts/runPython';
import * as util from './ts/util';
import Diagram from './ts/diagrams';
import Video from './ts/videoplayer';
import Settings from './ts/settings';
import Startscreen from './ts/startscreen';
(function () {
	const videoPlayer: HTMLVideoElement = $('#main_player')[0] as HTMLVideoElement;
	const skeletonPlayer: HTMLVideoElement = $('#skeleton_player')[0] as HTMLVideoElement;

	// Main initialization function that calls the initialization functions in other modules.
	const init = (configStore: ConfigStore): void => {
		const diagram = Diagram(videoPlayer, configStore);
		const videoControl = Video(videoPlayer, skeletonPlayer, configStore);
		const settings = Settings(
			() => {
				pythonScript((err: Error, data: string) => {
					util.processNewSetting(err, data, () => diagram.refreshCanvas());
				}, configStore.mutableData);
			},
			videoPlayer,
			configStore
		);
		videoControl.init();
		diagram.init(false);
		settings.init();
	};
	const startscreen = Startscreen(pythonScript, init, videoPlayer);
	startscreen.init();
})();
