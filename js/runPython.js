const exec = require('child_process').exec;
const fs = require('fs');

const pythonScript = (after_function) => {
	console.log('Python Script starts');
	const video_path = localStorage.getItem('video_path');
	const save_path = localStorage.getItem('save_path');
	const input = JSON.stringify({ video_path, save_path });
	// exec(`python ./py/processing_script.py "${video_path}" "${save_path}"`, after_function);
	// exec(`processing_script.exe "${video_path}" "${save_path}"`, after_function);
	fs.readFile('./json/test.json', 'utf8', after_function);
};
module.exports = pythonScript;
