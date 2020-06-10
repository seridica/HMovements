const fs = require('fs');
class ConfigStore {
	constructor(videoPath, savePath, threshold, epochLength) {
		this._videoPath = videoPath;
		this._savePath = savePath;
		this._threshold = threshold;
		this._epochLength = epochLength;
	}

	get mutableData() {
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

	set(key, val) {
		this[key] = val;
	}
	saveData(value) {
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

module.exports = ConfigStore;
