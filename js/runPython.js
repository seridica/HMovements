const { exec } = require('child_process');
const constants = require('./constants');
exports.pythonScript = (afterFunction, options = null) => {
	const videoPath = localStorage.getItem('videoPath');
	const savePath = localStorage.getItem('savePath');
	let openpose = 1;
	let epochLength = constants.epochLength;
	let headThreshold = constants.bodyPartsThreshold.Head;
	let armsThreshold = constants.bodyPartsThreshold.Arms;
	let legsThreshold = constants.bodyPartsThreshold.Legs;
	let feetThreshold = constants.bodyPartsThreshold.Feet;
	if (options) {
		openpose = 0;
		epochLength = options.epochLength;
		headThreshold = options.Head;
		armsThreshold = options.Arms;
		legsThreshold = options.Legs;
		feetThreshold = options.Feet;
	}
	// exec(
	// 	`python ./py/processing_script.py "${videoPath}" "${savePath}" ${openpose} ${headThreshold} ${armsThreshold} ${legsThreshold} ${feetThreshold} ${epochLength}`,
	// 	afterFunction
	// );
	exec(
		`processing_script.exe "${videoPath}" "${savePath}" ${openpose} ${headThreshold} ${armsThreshold} ${legsThreshold} ${feetThreshold} ${epochLength}`,
		afterFunction
	);
	// const data = await fs.readFile('./json/test.json', 'utf8');
};
