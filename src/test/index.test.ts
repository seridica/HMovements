import * as util from '../ts/util';
import * as $ from 'jquery';
import { IConfigStore, getConfigStore } from '../ts/configStore';
import Settings from '../ts/settings';

// Testing functions from util.ts
describe('Util Tests', () => {
	it('processRawData with invalid data', () => {
		expect(() => util.processRawData('')).toThrow('Video data cannot be read.');
		expect(() => util.processRawData('fsfsdfsd')).toThrow('Video data cannot be read.');
	});

	it('processRawData with valid data', () => {
		let sampleData = 'openpose information... {"motion": {"head": [3, 1]}}';
		let expectedData = '{"motion": {"head": [3, 1]}}';
		const data = util.processRawData(sampleData);

		expect(() => util.processRawData(sampleData)).not.toThrow('Video data cannot be read.');
		expect(data).toEqual(expectedData);
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
		let mockFn = jest.fn();
		window.alert = mockFn;
		let path = __dirname + '/testfiles2';
		expect(util.importExistingFile(path)).toEqual([]);
		expect(mockFn).toBeCalled();
	});

	it('importExistingFile with invalid path', () => {
		let mockFn = jest.fn();
		window.alert = mockFn;
		expect(util.importExistingFile('')).toEqual([]);
		expect(mockFn).toBeCalled();
	});

	it('importExistingFile with invalid path', () => {
		let mockFn = jest.fn();
		window.alert = mockFn;
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

	it('findNumOfFilesInDirectory', () => {
		let path = __dirname + '/testfiles';
		expect(util.findNumOfFilesInDirectory(path)).toEqual(3);
		expect(util.findNumOfFilesInDirectory('')).toEqual(0);
	});
});

// Testing functions from settings.ts
describe('Settings tests', () => {
	// This is necessary since the tests changes the innerHTML of the body
	let mockConfigStore: IConfigStore = getConfigStore();
	let settings = Settings({ duration: 5 } as any, mockConfigStore, null, null);
	beforeEach(() => {
		document.body.innerHTML = '';
		mockConfigStore.clear();
	});

	it('refreshSettings with basic inputs', () => {
		mockConfigStore.set('thresholds', { Head: 5, Arms: 3, Legs: 1, Feet: 2 });
		mockConfigStore.set('epochLength', 5);
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
		mockConfigStore.set('thresholds', { Head: 5, Arms: 3, Legs: 1, Feet: 2 });
		mockConfigStore.set('epochLength', 5);
		document.body.innerHTML =
			'<div>' +
			'	<input id="epochLength_setting" value="4"/>' +
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
