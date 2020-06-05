const { body_parts_threshold } = require('./constants');
const fs = require('fs');
class ConfigStore {
	constructor(video_path, save_path, threshold, epoch_length) {
		this.video_path = video_path;
		this.save_path = save_path;
		this.threshold = threshold;
		this.epoch_length = epoch_length;
	}

	get mutable_data() {
		return {
			epoch_length: this.epoch_length,
			...this.threshold,
		};
	}

	set(key, val) {
		this[key] = val;
	}
	save_data(value) {
		this.threshold = value.threshold;
		this.epoch_length = value.epoch_length;
		this.write_settings();
	}

	write_settings() {
		const settings = {
			video_path: this.video_path,
			body_parts_threshold: this.threshold,
			epoch_length: this.epoch_length,
		};
		fs.writeFileSync(`${this.save_path}/config.json`, JSON.stringify(settings), 'utf8');
	}
}

module.exports = ConfigStore;
