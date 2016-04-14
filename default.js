// a default JS file that is provided by apert
// when no artist-provided specific file has been loaded
// this file also functions as a demo of how such an artist-provided
// specific JavaScript file might be written

function simple(freq,amp) {
  apertStartAudio();
	var sine = ac.createOscillator();
	sine.type = 'sine';
	sine.frequency.value = freq;
	var gain = ac.createGain();
	sine.connect(gain);
	gain.connect(ac.destination);
	sine.start();
	// envelope
	var now = ac.currentTime;
	gain.gain.setValueAtTime(0,now);
  gain.gain.linearRampToValueAtTime(amp,now+0.005); gain.gain.linearRampToValueAtTime(0,now+0.405);
	// schedule cleanup
	setTimeout(function() {
		sine.stop();
		sine.disconnect(gain);
		gain.disconnect(ac.destination);
	},1000);
};

document.addEventListener('DOMContentLoaded',function() {
  // write label to top of document
  var div = document.createElement('div');
  var text = document.createTextNode('apert (default.js)');
  div.appendChild(text);
  document.body.appendChild(div);
  // create a clickable button and append to document
  var button = document.createElement("button");
  var label = document.createTextNode("simple test tone");
  button.appendChild(label);
  button.addEventListener('click',function() {
    simple(440,0.5);
  },false);
  document.body.appendChild(button);
},false);
