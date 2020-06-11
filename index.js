const $ = require('jquery');
const _ = require('lodash');
var configStore = null;
(function () {
	const videoPlayer = $('#main_player')[0];
	const skeletonPlayer = $('#skeleton_player')[0];
	const { pythonScript } = require('./js/runPython');
	const util = require('./js/util');
	const diagram = require('./js/diagrams');
	const video = require('./js/videoplayer');
	const settings = require('./js/settings');
	const startscreen = require('./js/startscreen');

	const init = () => {
		video.init(videoPlayer, skeletonPlayer);
		diagram.init(videoPlayer, false);
		settings.init(() => {
			pythonScript((err, data) => {
				util.processNewSetting(err, data, diagram.refreshCanvas);
			}, configStore.mutableData);
		}, videoPlayer);
	};

	startscreen.init(pythonScript, init);
})();
