import * as fs from 'fs';
import * as path from 'path';

let configStore: ConfigStore | null = null;
export function getConfigStore(): ConfigStore {
	if (configStore === null) configStore = new ConfigStore();
	return configStore;
}

export class ConfigStore {
	private _data: { [Key: string]: any } = {};
	set(name: string, value: any) {
		this._data[name] = value;
	}

	get(name: string) {
		if (name in this._data) return this._data[name];
		else return null;
	}

	getEpochThresholdData() {
		let epochLength = this.get('epochLength');
		let thresholds = this.get('thresholds');
		let epochThresholdData = { epochLength, ...thresholds };
		return epochThresholdData;
	}

	getDirectoryPaths() {
		let videoPath = this.get('videoPath');
		let skeletonPath = this.get('skeletonPath');
		let directoryPaths: any = { videoPath, skeletonPath };
		return directoryPaths;
	}
	saveData(value: any) {
		this.set('thresholds', value.threshold);
		this.set('epochLength', value.epochLength);
		this.set('videoPath', value.videoPath);
		this.set('skeletonPath', value.skeletonPath);
		this.writeSettings();
	}

	writeSettings() {
		const settings = {
			videoPath: this.get('videoPath'),
			bodyPartsThreshold: this.get('thresholds'),
			epochLength: this.get('epochLength'),
			skeletonPath: this.get('skeletonPath'),
		};
		let savePath = this.get('savePath');
		fs.writeFileSync(path.join(savePath, 'config.json'), JSON.stringify(settings), 'utf8');
	}
}
