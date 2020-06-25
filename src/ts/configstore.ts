import * as fs from 'fs';
import type { IGeneralThresholds } from './constants';
export default class ConfigStore {
	private _videoPath: string;
	private _savePath: string;
	private _threshold: any;
	private _epochLength: number;

	constructor(videoPath: string, savePath: string, threshold: IGeneralThresholds, epochLength: number) {
		this._videoPath = videoPath;
		this._savePath = savePath;
		this._threshold = threshold;
		this._epochLength = epochLength;
	}

	get mutableData(): IGeneralThresholds & { epochLength: number } {
		return {
			epochLength: this._epochLength,
			...this._threshold,
		};
	}

	get epochLength() {
		return this._epochLength;
	}

	get videoPath() {
		return this._videoPath;
	}

	saveData(value: { threshold: IGeneralThresholds; epochLength: number }) {
		this._threshold = value.threshold;
		this._epochLength = value.epochLength;
		this.writeSettings();
	}

	writeSettings() {
		const settings = {
			videoPath: this._videoPath,
			bodyPartsThreshold: this._threshold,
			epochLength: this._epochLength,
		};
		fs.writeFileSync(`${this._savePath}/config.json`, JSON.stringify(settings), 'utf8');
	}
}
