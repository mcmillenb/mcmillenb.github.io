// create the audio context for sounds to use
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const $sandbox   = $('#sandbox');
const $soundType = $('#sound-type');

var dots = [];

// Add a new MusicDot when user clicks the sandbox
$('body').on('mousedown touchstart', '#sandbox', (e) => {
	if (e.shiftKey) {
		return;
	}
	var type = $soundType.val();
	dots.push(new MusicDot(e, type));
});

// Remove all of the MusicDots when user clicks Reset
$('body').on('click', '#reset', (e) => {
	for (var i = 0; i < dots.length; i++) {
		dots[i].remove();
		delete dots[i];
	}
	dots = [];
});