const { remote } = require('electron');
exports.init = function (pythonScript, videoPlayer) {
	let settings = configStore.mutableData;
	let mutableSettingsList = [];
	for (let key in settings) {
		mutableSettingsList.push(`
			<div style="flex: 1; align-items: center;">
				<label style="font-size: 1vw; text-align: center;">${key == 'epochLength' ? 'Epoch Length' : key}: </label>
				<input
					id="${key}_setting"
					style="text-align: center; font-size: 1vw; height: 3vh; width: 7vw; outline: none; border: none; border-bottom: 1px solid black;"
					type="text"
					value="${settings[key]}"
				/>
			</div>
		`);
	}
	mutableSettingsList.map((i) => {
		$('#settings_container').append(i);
	});

	const refreshSettings = () => {
		let settings = configStore.mutableData;
		for (let key in settings) {
			$('#' + key + '_setting').val(settings[key]);
		}
	};

	const exitSettings = () => {
		$('#settings_content').animate(
			{ top: '50vh', opacity: '0%' },
			{
				duration: 500,
				complete: () => {
					$('#settings_content').css({ display: 'none' });
				},
			}
		);
		refreshSettings();
	};

	const saveSettings = () => {
		let settings = configStore.mutableData;
		let newSettings = {};
		let threshold = {};
		for (let key in settings) {
			let setting = $('#' + key + '_setting').val();
			if (isNaN(setting)) {
				throw new Error('Please enter numbers only');
			}
			if (parseFloat(setting) < 0) {
				throw new Error('Please enter positive numbers only');
			}
			if (key === 'epochLength') {
				if (setting > videoPlayer.duration) {
					throw new Error('The Epoch Length must be shorter than the video duration');
				}
				newSettings = { epochLength: setting };
			} else {
				threshold[key] = setting;
			}
		}
		newSettings = _.assign(newSettings, { threshold });
		configStore.saveData(newSettings);
	};

	$('#settings_btn').click(() => {
		$('#settings_content').css({ display: 'flex', top: '50vh', opacity: '0%' });
		$('#settings_content').animate({ top: '25vh', opacity: '100%' }, 500);
		refreshSettings();
	});

	$('#close_btn').click(exitSettings);

	$('#content_wrapper').click(exitSettings);

	$('#save_btn').click(() => {
		try {
			saveSettings();
			exitSettings();
			$('#loading').css({ visibility: 'visible' });
			$('#main_content').css({ visibility: 'hidden' });
			pythonScript();
		} catch (error) {
			remote.dialog.showErrorBox(error.message, 'Please Try Again');
		}
	});
};
