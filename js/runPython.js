const exec = require('child_process').exec;
const fs = require('fs');
const constants = require('./constants');
const pythonScript = (after_function, options = null) => {
	console.log('Python Script starts');
	const video_path = localStorage.getItem('video_path');
	const save_path = localStorage.getItem('save_path');
	const input = JSON.stringify({ video_path, save_path });
	let openpose = 1;
	let epoch_length = constants.epoch_length;
	let head_threshold = constants.body_parts_threshold.Head;
	let arms_threshold = constants.body_parts_threshold.Arms;
	let legs_threshold = constants.body_parts_threshold.Legs;
	let feet_threshold = constants.body_parts_threshold.Feet;
	if (options) {
		openpose = 0;
		epoch_length = options.epoch_length;
		head_threshold = options.Head;
		arms_threshold = options.Arms;
		legs_threshold = options.Legs;
		feet_threshold = options.Feet;
	}
	exec(
		`python ./py/processing_script.py "${video_path}" "${save_path}" ${openpose} ${head_threshold} ${arms_threshold} ${legs_threshold} ${feet_threshold} ${epoch_length}`,
		after_function
	);
	// exec(`processing_script.exe "${video_path}" "${save_path}"`, after_function);
	// const data = await fs.readFile('./json/test.json', 'utf8');
	// after_function(data);
};
module.exports = pythonScript;
