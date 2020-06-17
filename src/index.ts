import * as $ from 'jquery';
import * as _ from 'lodash';
import ConfigStore from './ts/configstore';
import pythonScript from './ts/runPython';
import * as util from './ts/util';
import Diagram from './ts/diagrams';
import * as video from './ts/videoplayer';
import * as settings from './ts/settings';
import * as startscreen from './ts/startscreen';
(function () {
	const videoPlayer: HTMLVideoElement = <HTMLVideoElement>$('#main_player')[0];
	const skeletonPlayer: HTMLVideoElement = <HTMLVideoElement>$('#skeleton_player')[0];
	const init = (configStore: ConfigStore) => {
		const diagram = Diagram(videoPlayer, configStore);
		video.init(videoPlayer, skeletonPlayer, configStore);
		diagram.init(false);
		settings.init(
			() => {
				pythonScript((err: Error, data: any) => {
					util.processNewSetting(err, data, () => diagram.refreshCanvas());
				}, configStore.mutableData);
			},
			videoPlayer,
			configStore
		);
	};

	startscreen.init(pythonScript, init, videoPlayer);
})();
