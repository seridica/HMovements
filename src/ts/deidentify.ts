import * as $ from 'jquery';
import * as path from 'path';
import ConfigStore from './configstore';
import * as util from './util';

export default function deidentify(deidentifyVideo: Function, configStore: ConfigStore, videoControl: any) {
	function init() {
		$('#close_deidentification_btn').click(exitDialog);
		$('#deidentify-dialog-btn').click(() => {
			$('#deidentification_dialog').css({ display: 'flex', top: '50vh', opacity: '0%' });
			$('#deidentification_dialog').animate({ top: '37.5vh', opacity: '100%' }, 500);
		});

		$('#deidentify_btn').click(() => {
			exitDialog();
			deidentifyVideo(configStore, (error: any, data: any) => {
				if (error) {
					console.log(error);
				} else {
					const savePath: string = configStore.savePath;
					configStore.videoPath = path.join(savePath, 'blurred.mp4');
					configStore.skeletonPath = path.join(savePath, 'blurred_skeleton.mp4');
					configStore.writeSettings();
					videoControl.loadVideos();
				}
			});
		});

		$('#content_wrapper').click(exitDialog);
	}

	function exitDialog() {
		$('#deidentification_dialog').animate(
			{ top: '50vh', opacity: '0%' },
			{
				duration: 500,
				complete: function () {
					$(this).css({ display: 'none' });
				},
			}
		);
	}

	return {
		init,
	};
}
