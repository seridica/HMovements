import * as $ from 'jquery';
import * as path from 'path';
import { IConfigStore } from './configstore';
import * as util from './util';
import { deidentifyVideo } from './runPython';

export default function deidentify(configStore: IConfigStore, videoControl: any) {
	function init() {
		initCloseDeidentificationButton();
		initDeidentifyDialogButton();
		initDeidentifyButton();
	}

	function initCloseDeidentificationButton() {
		let closeDeidentificationButton = $('#close_deidentification_btn');
		closeDeidentificationButton.click(exitDialog);
	}

	function initDeidentifyDialogButton() {
		let deidentifyDialogButton = $('#deidentify_dialog_btn');
		let deidentificationDialog = $('#deidentification_dialog');
		deidentifyDialogButton.click(() => {
			deidentificationDialog.css({ display: 'flex', top: '50vh', opacity: '0%' });
			deidentificationDialog.animate({ top: '37.5vh', opacity: '100%' }, 500);
		});
	}

	function initDeidentifyButton() {
		let deidentifyButton = $('#deidentify_btn');
		let contentWrapper = $('#content_wrapper');
		deidentifyButton.click(() => {
			exitDialog();
			videoControl.pauseVideoIfPlaying();
			util.turnOnLoadingScreen();
			deidentifyVideo().then(handleAfterDeidentification, () => {
				alert('Something went wrong. Please try again.');
			});
		});

		contentWrapper.click(exitDialog);
	}

	function handleAfterDeidentification() {
		const savePath: string = configStore.get('savePath');
		configStore.set('videoPath', path.join(savePath, 'blurred.mp4'));
		configStore.set('skeletonPath', path.join(savePath, 'blurred_skeleton.mp4'));
		configStore.writeSettings();
		videoControl.loadVideos();
		util.turnOffLoadingScreen();
	}

	function exitDialog() {
		let deidentificationDialog = $('#deidentification_dialog');
		deidentificationDialog.animate(
			{ top: '50vh', opacity: '0%' },
			{
				duration: 500,
				complete: function () {
					util.toggleElementVisibility(deidentificationDialog, false);
				},
			}
		);
	}

	return {
		init,
	};
}
