import * as util from '../ts/util';
import * as $ from 'jquery';
import ConfigStore from '../ts/configStore';
import Settings from '../ts/settings';

// Testing functions from util.ts
describe('Util Tests', () => {
	// This is necessary since a few tests set items in localStorage
	beforeEach(() => {
		localStorage.clear();
	});

	it('processNewFile without path in localStorage', () => {
		const initFn = jest.fn();
		util.processNewFile(undefined, '', initFn);
		expect(initFn).not.toBeCalled();
	});

	it('processNewFile with path in localStorage', () => {
		let data = {
			test: 'test',
		};
		localStorage.setItem('savePath', __dirname + '/testfiles/');
		const initFn = jest.fn();
		util.processNewFile(undefined, JSON.stringify(data), initFn);
		expect(initFn).toBeCalled();
	});

	it('processNewFile with error', () => {
		localStorage.setItem('savePath', __dirname + '/testfiles/');
		const initFn = jest.fn();
		util.processNewFile(new Error('test'), '', initFn);
		expect(initFn).not.toBeCalled();
	});

	it('processNewSetting without path in localStorage', () => {
		let data = {
			test: 'test',
		};
		const refreshCanvas = jest.fn();
		document.body.innerHTML =
			'<div>' +
			'<div id="loading" style="visibility: visible;"></div>' +
			'<div id="main_content" style="visibility: hidden;"></div>' +
			'</div>';
		util.processNewSetting(undefined, JSON.stringify(data), refreshCanvas);
		expect(refreshCanvas).not.toBeCalled();
		expect($('#loading').css('visibility')).toEqual('visible');
		expect($('#main_content').css('visibility')).toEqual('hidden');
	});

	it('processNewSetting with path in localStorage', () => {
		let data = {
			test: 'test',
		};
		const refreshCanvas = jest.fn();
		localStorage.setItem('savePath', __dirname + '/testfiles/');
		document.body.innerHTML =
			'<div>' +
			'<div id="loading" style="visibility: visible;"></div>' +
			'<div id="main_content" style="visibility: hidden;"></div>' +
			'</div>';
		util.processNewSetting(undefined, JSON.stringify(data), refreshCanvas);
		expect(refreshCanvas).toBeCalled();
		expect($('#loading').css('visibility')).toEqual('hidden');
		expect($('#main_content').css('visibility')).toEqual('visible');
	});

	it('processNewSetting with Error', () => {
		let data = {
			test: 'test',
		};
		const refreshCanvas = jest.fn();
		localStorage.setItem('savePath', __dirname + '/testfiles/');
		document.body.innerHTML =
			'<div>' +
			'<div id="loading" style="visibility: visible;"></div>' +
			'<div id="main_content" style="visibility: hidden;"></div>' +
			'</div>';
		util.processNewSetting(new Error('test'), JSON.stringify(data), refreshCanvas);
		expect(refreshCanvas).not.toBeCalled();
		expect($('#loading').css('visibility')).toEqual('visible');
		expect($('#main_content').css('visibility')).toEqual('hidden');
	});

	it('getVideoName with invalid path', () => {
		expect(util.getVideoName('')).toBeNull();
	});

	it('getVideoName with valid path', () => {
		let path = __dirname + '\\testfiles\\test.mp4';
		expect(util.getVideoName(path)).toEqual('test');
	});

	it('importExistingFile with valid path and essential files', () => {
		let path = __dirname + '/testfiles';
		expect(util.importExistingFile(path)).not.toBeNull();
	});

	it('importExistingFile with valid path but missing essential files', () => {
		let path = __dirname + '/testfiles2';
		expect(util.importExistingFile(path)).toBeNull();
	});

	it('importExistingFile with invalid path', () => {
		expect(util.importExistingFile('')).toBeNull();
	});

	it('formatVideoTime', () => {
		expect(util.formatVideoTime(0)).toEqual('00:00');
		expect(util.formatVideoTime(-2)).toEqual('00:00');
		expect(util.formatVideoTime(65)).toEqual('01:05');
		expect(util.formatVideoTime(129)).toEqual('02:09');
		expect(util.formatVideoTime(9002)).toEqual('2:30:02');
	});

	it('calculateVideoDurationByEpoch', () => {
		expect(util.calculateVideoDurationByEpoch(5, 55)).toEqual(55);
		expect(util.calculateVideoDurationByEpoch(5, 57)).toEqual(55);
		expect(util.calculateVideoDurationByEpoch(10, 57)).toEqual(50);
		expect(util.calculateVideoDurationByEpoch(0, 57)).toEqual(0);
	});

	it('filesSoFar', () => {
		let path = __dirname + '/testfiles';
		expect(util.filesSoFar(path)).toEqual(3);
		expect(util.filesSoFar('')).toEqual(0);
	});
});

// Testing functions from settings.ts
describe('Settings tests', () => {
	// This is necessary since the tests changes the innerHTML of the body
	beforeEach(() => {
		document.body.innerHTML = '';
	});

	let mockConfigStore: ConfigStore = new ConfigStore('', '', { Head: 5, Arms: 3, Legs: 1, Feet: 2 }, 5);
	let pythonScript = jest.fn();
	let settings = Settings(pythonScript, { duration: 5 } as any, mockConfigStore, null);

	it('refreshSettings with basic inputs', () => {
		document.body.innerHTML =
			'<div>' +
			'	<input id="epochLength_setting" value=4/>' +
			'	<input id="Head_setting" value=4/>' +
			'	<input id="Arms_setting" value=2/>' +
			'	<input id="Legs_setting" value=0/>' +
			'	<input id="Feet_setting" value=5/>' +
			'</div>';
		settings.refreshSettings();
		expect(Number($('#epochLength_setting').val())).toEqual(5);
		expect(Number($('#Head_setting').val())).toEqual(5);
		expect(Number($('#Arms_setting').val())).toEqual(3);
		expect(Number($('#Legs_setting').val())).toEqual(1);
		expect(Number($('#Feet_setting').val())).toEqual(2);
	});

	it('saveSettings with valid inputs', () => {
		document.body.innerHTML =
			'<div>' +
			'	<input id="epochLength_setting" value="6"/>' +
			'	<input id="Head_setting" value="4"/>' +
			'	<input id="Arms_setting" value="2"/>' +
			'	<input id="Legs_setting" value="1"/>' +
			'	<input id="Feet_setting" value="5"/>' +
			'</div>';
		let saveData = jest.fn();
		mockConfigStore.saveData = saveData;
		settings.saveSettings();
		expect(saveData).toBeCalled();
	});

	it('saveSettings with non-number inputs', () => {
		document.body.innerHTML =
			'<div>' +
			'	<input id="epochLength_setting" value="4sl"/>' +
			'	<input id="Head_setting" value="s4"/>' +
			'	<input id="Arms_setting" value="2"/>' +
			'	<input id="Legs_setting" value="1"/>' +
			'	<input id="Feet_setting" value="5"/>' +
			'</div>';
		let saveData = jest.fn();
		mockConfigStore.saveData = saveData;
		try {
			settings.saveSettings();
		} catch (e) {
			expect(e.message).toEqual('Please enter numbers only');
		}
		expect(saveData).not.toBeCalled();
	});

	it('saveSettings with non-positive inputs', () => {
		document.body.innerHTML =
			'<div>' +
			'	<input id="epochLength_setting" value="-4"/>' +
			'	<input id="Head_setting" value="4"/>' +
			'	<input id="Arms_setting" value="2"/>' +
			'	<input id="Legs_setting" value="-1"/>' +
			'	<input id="Feet_setting" value="5"/>' +
			'</div>';
		let saveData = jest.fn();
		mockConfigStore.saveData = saveData;
		try {
			settings.saveSettings();
		} catch (e) {
			expect(e.message).toEqual('Please enter positive numbers only');
		}
		expect(saveData).not.toBeCalled();
	});

	it('saveSettings with epoch length shorter than video duration', () => {
		document.body.innerHTML =
			'<div>' +
			'	<input id="epochLength_setting" value="6"/>' +
			'	<input id="Head_setting" value="4"/>' +
			'	<input id="Arms_setting" value="2"/>' +
			'	<input id="Legs_setting" value="1"/>' +
			'	<input id="Feet_setting" value="5"/>' +
			'</div>';
		let saveData = jest.fn();
		mockConfigStore.saveData = saveData;
		try {
			settings.saveSettings();
		} catch (e) {
			expect(e.message).toEqual('The Epoch Length must be shorter than the video duration');
		}
		expect(saveData).not.toBeCalled();
	});
});
