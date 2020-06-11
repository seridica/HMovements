const { formatVideoTime, getVideoName } = require('./util');

function initVideoPlayers(videoPlayer, skeletonPlayer) {
	const videoPath = localStorage.getItem('videoPath');
	const savePath = localStorage.getItem('savePath');
	videoPlayer.src = configStore.videoPath;
	skeletonPlayer.src = savePath + `/${getVideoName(videoPath)}.mp4`;
	videoPlayer.load();
	skeletonPlayer.load();
	const checkVideo = () => {
		var interval = setInterval(() => {
			if (videoPlayer.readyState >= 3) {
				$('#video_time').text(formatVideoTime(videoPlayer.currentTime) + ' / ' + formatVideoTime(videoPlayer.duration));
				$('#main_content').css({ visibility: 'visible' });
				$('#loading').css({ visibility: 'hidden' });
				clearInterval(interval);
			}
		}, 500);
	};
	checkVideo();
}

function initVideoControls(videoPlayer, skeletonPlayer) {
	$('#play_btn').click(() => {
		videoPlayer.play();
		skeletonPlayer.play();
		videoPlayer.ontimeupdate = () => {
			const barWidth = $('#progress_bar_container').width();
			const percentage = videoPlayer.currentTime / videoPlayer.duration;
			$('#progress_bar').css({ width: percentage * barWidth });
			$('#video_time').text(formatVideoTime(videoPlayer.currentTime) + ' / ' + formatVideoTime(videoPlayer.duration));
			if (videoPlayer.ended) {
				$('#play_btn').css({ display: 'inline' });
				$('#pause_btn').css({ display: 'none' });
			}
		};
		$('#pause_btn').css({ display: 'inline' });
		$('#play_btn').css({ display: 'none' });
	});

	$('#pause_btn').click(() => {
		videoPlayer.pause();
		skeletonPlayer.pause();
		$('#play_btn').css({ display: 'inline' });
		$('#pause_btn').css({ display: 'none' });
	});

	var clicking = false;
	$('#progress_bar_container').mousedown((e) => {
		clicking = true;
		const barWidth = $('#progress_bar_container').width();
		const posX = (e.pageX - $('#progress_bar_container').offset().left) / barWidth;
		$('#progress_bar').css({ width: posX * barWidth });
		videoPlayer.currentTime = videoPlayer.duration * posX;
		skeletonPlayer.currentTime = videoPlayer.duration * posX;
		$('#video_time').text(formatVideoTime(videoPlayer.currentTime) + ' / ' + formatVideoTime(videoPlayer.duration));
	});

	$('#progress_bar_container').mousemove((e) => {
		if (clicking === true) {
			const barWidth = $('#progress_bar_container').width();
			const posX = (e.pageX - $('#progress_bar_container').offset().left) / barWidth;
			$('#progress_bar').css({ width: posX * barWidth });
			videoPlayer.currentTime = videoPlayer.duration * posX;
			skeletonPlayer.currentTime = videoPlayer.duration * posX;
			$('#video_time').text(formatVideoTime(videoPlayer.currentTime) + ' / ' + formatVideoTime(videoPlayer.duration));
		}
	});

	$('#progress_bar_container').mouseup(() => {
		clicking = false;
	});
}

exports.init = function (videoPlayer, skeletonPlayer) {
	initVideoPlayers(videoPlayer, skeletonPlayer);
	initVideoControls(videoPlayer, skeletonPlayer);
};
