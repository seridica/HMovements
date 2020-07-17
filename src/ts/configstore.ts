import * as fs from 'fs';
import * as path from 'path';
import type { IGeneralThresholds } from './constants';
export default class ConfigStore {
	private _videoPath: string;
	private _savePath: string;
	private _skeletonPath: string;
	private _threshold: any;
	private _epochLength: number;

	constructor(videoPath: string, savePath: string, threshold: IGeneralThresholds, epochLength: number, skeletonPath: string | undefined = '') {
		this._videoPath = videoPath;
		this._savePath = savePath;
		this._threshold = threshold;
		this._epochLength = epochLength;
		this._skeletonPath = skeletonPath ? skeletonPath : path.join(savePath, 'skeleton.mp4');
	}

	get epochThresholdData(): IGeneralThresholds & { epochLength: number } {
		return {
			epochLength: this._epochLength,
			...this._threshold,
		};
	}

	get directoryData() {
		return {
			videoPath: this._videoPath,
			skeletonPath: this._skeletonPath,
		};
	}

	get epochLength() {
		return this._epochLength;
	}

	get videoPath() {
		return this._videoPath;
	}

	set videoPath(path) {
		this._videoPath = path;
	}

	get skeletonPath() {
		return this._skeletonPath;
	}

	set skeletonPath(path) {
		this._skeletonPath = path;
	}

	get savePath() {
		return this._savePath;
	}

	saveData(value: any) {
		this._threshold = value.threshold;
		this._epochLength = value.epochLength;
		this._videoPath = value.videoPath;
		this._skeletonPath = value.skeletonPath;
		this.writeSettings();
	}

	writeSettings() {
		const settings = {
			videoPath: this._videoPath,
			bodyPartsThreshold: this._threshold,
			epochLength: this._epochLength,
			skeletonPath: this._skeletonPath,
		};
		fs.writeFileSync(`${this._savePath}/config.json`, JSON.stringify(settings), 'utf8');
	}
}
