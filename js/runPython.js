const exec = require('child_process').exec;
const fs = require('fs');

const pythonExe = () => {
	console.log('Python Script starts');
	exec('test.exe', (err, data) => {
		console.log(data.toString());
	});
};

const pythonScript = () => {
	console.log('Python Script starts');
	// exec('python ./py/processing_script.py', (err, data) => {
	// 	fs.writeFile('./json/test.json', data.toString(), 'utf8', () => {});
	// 	$('#main_content').css({ visibility: 'visible' });
	// 	$('#loading').css({ visibility: 'hidden' });
	// });
	fs.readFile('./json/test.json', 'utf8', (err, data) => {
		if (err) {
			console.error(err);
		} else {
			localStorage.setItem('video_data', data);
		}
		$('#main_content').css({ visibility: 'visible' });
		$('#loading').css({ visibility: 'hidden' });
	});
};
module.exports = pythonScript;
