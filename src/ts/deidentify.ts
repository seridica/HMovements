import * as $ from 'jquery';
import * as path from 'path';
import { IConfigStore } from './configstore';
import * as util from './util';
import { deidentifyVideo } from './runPython';
import * as fs from 'fs';

export default function deidentify(configStore: IConfigStore, videoControl: any) {
	function init() {
		initCloseDeidentificationButton();
		initDeidentifyDialogButton();
		initDeidentifyButton();
	}

	function initCloseDeidentificationButton() {
		let closeDeidentificationButton = $('#close-deidentification-btn');
		closeDeidentificationButton.click(exitDialog);
	}

	function initDeidentifyDialogButton() {
		let deidentifyDialogButton = $('#deidentify-dialog-btn');
		let deidentificationDialog = $('#deidentification-dialog');
		deidentifyDialogButton.click(() => {
			deidentificationDialog.css({ display: 'flex', top: '50vh', opacity: '0%' });
			deidentificationDialog.animate({ top: '37.5vh', opacity: '100%' }, 500);
		});
	}

	function initDeidentifyButton() {
		let deidentifyButton = $('#deidentify-btn');
		let contentWrapper = $('#content-wrapper');
		deidentifyButton.click(() => {
			exitDialog();
			if (safeToDeidentify()) {
				videoControl.pauseVideoIfPlaying();
				util.turnOnLoadingScreen();
				deidentifyVideo().then(handleAfterDeidentification, () => {
					let message =
						'Please check if the deidentification.exe file is missing and relaunch the application.';
					util.sendAlertMessage({ message });
				});
			} else {
				let message =
					'You have undergone through the deidentification process before. Please move the video files prefixed with "blurred" elsewhere before continuing. \n\nDo not forget to change paths in settings before moving the files.';
				util.sendAlertMessage({ message });
			}
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
		new Notification('HMovements', {
			body: 'Deidentification Complete.',
		});
	}

	function exitDialog() {
		let deidentificationDialog = $('#deidentification-dialog');
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

	function safeToDeidentify() {
		let savePath = configStore.get('savePath');
		const directories = fs.readdirSync(savePath);
		let hasBeenBlurred = false;
		directories.forEach((directory) => {
			if (directory.indexOf('blurred') >= 0) hasBeenBlurred = true;
		});
		return !hasBeenBlurred;
	}

	return {
		init,
	};
}
